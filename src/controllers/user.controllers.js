import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// Function to register a new user
const registerUser = asyncHandler(async (req, res, next) => {
    // Steps to register a user
    // 1. Get the user data from the request body (username, email, fullName, password, avatar, coverImage)✅
    // 2. Validate the user data and ensure that the required fields are not empty✅
    // 3. Check if the user already exists in the database with the provided email and username✅
    // 4. If the user already exists, return an error response with a status code of 409 (Conflict)✅
    // 5. If the user does not exist, proceed to the next step✅
    // 6. Check if the user has provided an image for the avatar and coverImage fields. Avatar is required, coverImage is optional✅
    // 7. If the user has provided an image, upload the image to a cloud storage service - Cloudinary✅
    // 8. If the image upload is successful, create a new user object with the image URLs and create the user in the database✅
    // 9. Check if the user creation is successful and return an error response with a status code of 500 (Internal Server Error) if it fails✅
    // 10. Send a success response with the user object and return the response to the client with a status code of 201 (Created) and remove the password field and refresh token from the user object✅

    // 1
    let { username, email, fullName, password } = req.body;

    // 2
    [username, email, fullName, password].forEach((field) => {
        if (!field.trim()) {
            throw new ApiError(400, "Please provide all the required fields");
        };
        // Check if the email is valid
        if (field === email) {
            if (!field.includes("@") || !field.includes(".")) {
                throw new ApiError(400, "Please provide a valid email address");
            }
        }
    });

    // 3,4
    const ifUserExists = await User.findOne({ $or: [{ username }, { email }] });
    if (ifUserExists) {
        throw new ApiError(409, "User already exists");
    }

    // 6
    let avatarLocalPath = req.files.avatar ? req.files.avatar[0].path : undefined;
    let coverImageLocalPath = req.files.coverImage ? req.files.coverImage[0].path : undefined;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide an avatar image");
    }

    // 7
    let avatarURL = await uploadToCloudinary(avatarLocalPath);
    let coverImageURL = coverImageLocalPath ? await uploadToCloudinary(coverImageLocalPath) : null;
    // Check if the image upload is successful
    if (!avatarURL || (coverImageLocalPath && !coverImageURL)) {
        throw new ApiError(500, "An error occurred while uploading the image");
    }

    // 8
    const newUser = await User.create({
        username : username.replaceAll(" ", "").toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatarURL,
        coverImage: coverImageURL
    });

    // 9
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "An error occurred while creating the user");
    }

    // 10
    res.status(201).json(new ApiResponse(createdUser, "User Registered Successfully", 201 ));
});

// Function to login a user
const loginUser = asyncHandler(async (req, res, next) => {
    // Steps to login a user
    // 1. Get the user data from the request body (username or email, password)
    // 2. Validate the user data and ensure that the required fields are not empty
    // 3. Check if the user exists in the database with the provided username or email
    // 4. If the user does not exist, return an error response with a status code of 404 (Not Found)
    // 5. If the user exists, check if the password provided matches the password in the database
    // 6. If the password does not match, return an error response with a status code of 401 (Unauthorized)
    // 7. If the password matches, generate a new access token and refresh token for the user
    // 8. Save the refresh token in the database and send the access token and refresh token in form of cookies
    // 9. Return the response to the client with a status code of 200 (OK) and remove the password field from the user object

    // 1
    let username;
    let email;
    const { usernameOrEmail , password } = req.body;

    // 2
    if (!usernameOrEmail) {
        throw new ApiError(400, "Please provide a username or email");
    }
    
    if (!password) {
        throw new ApiError(400, "Please provide a password");
    }
    
    if(usernameOrEmail.includes("@") && usernameOrEmail.includes(".") ) {
        email = usernameOrEmail;
    } else {
        username = usernameOrEmail;
    } 

    // 3
    const user = await User.findOne({ $or: [{username}, {email}] });

    // 4
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 5
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    // 6
    if(!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials");
    }

    // 7
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // 8
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // 9
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse({ 
            user: loggedInUser, refreshToken, accessToken 
        }, "User logged in successfully", 200)
    );

});

// Function to logout a user
const logoutUser = asyncHandler(async (req, res, next) => {
    const user = req.user;
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("refreshToken", options)    
        .clearCookie("accessToken", options)
        .json(new ApiResponse({}, "User logged out successfully", 200)
    );
});

// Function to refresh the access token
const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedRefreshToken._id);
    
        if (!user || (user.refreshToken !== incomingRefreshToken)) {
            throw new ApiError(401, "Refresh token expired or invalid");
        }
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse({ accessToken, refreshToken }, "Access token refreshed successfully", 200));
    } catch (error) {
        throw new ApiError(401, "Refresh token expired or invalid");
    }
    
});

// Function to change the current password
const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    // Steps to change the current password
    // 1. Get the user data from the request body (currentPassword, newPassword)
    // 2. Validate the user data and ensure that the required fields are not empty
    // 3. Get the user object from the request body
    // 4. Check if the current password provided matches the password in the database
    // 5. If the password does not match, return an error response with a status code of 401 (Unauthorized)
    // 6. If the password matches, update the user object with the new password
    // 7. Save the user object in the database
    // 8. Return the response to the client with a status code of 200 (OK) and remove the password field from the user object

    // 1
    const { currentPassword, newPassword } = req.body;

    // 2
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Fields cannot be empty");
    }

    
    // 3
    const user = await User.findById(req.user._id);
    
    // 4
    const isCurrentPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    
    // 5
    if (!isCurrentPasswordCorrect) {
        throw new ApiError(401, "Invalid current password");
    }

    if (currentPassword === newPassword) {
        throw new ApiError(400, "New password cannot be the same as the current password");
    }
    
    // 6
    user.password = newPassword;

    // 7
    await user.save({ validateBeforeSave: false });

    // 8
    res.status(200).json(new ApiResponse({}, "Password changed successfully", 200));
});

// Function to get the current user details
const getCurrentUser = asyncHandler(async (req, res, next) => {
    // Steps to get the current user details
    // Get the user object from the request and return the response to the client with a status code of 200 (OK)
    const user = req.user;
    res.status(200).json(new ApiResponse(user, "User details retrieved successfully", 200));
});

// Function to update user details
const updateUserDetails = asyncHandler(async (req, res, next) => {
    // Steps to update user details
    // 1. Get the user data from the request body (email, fullName)
    // 2. Validate the user data and ensure that at least one field is provided for update
    // 3. Get the user object from the database using the request body
    // 4. Update the user object with the new data
    // 5. Return the response to the client with a status code of 200 (OK) and remove the password field and refresh token from the user object

    // 1
    const { email, fullName } = req.body;

    // 2
    if (!email && !fullName) {
        throw new ApiError(400, "Please provide at least one field to update");
    }

    // 3
    const newEmail = email ? email : req.user.email;
    const newFullName = fullName ? fullName : req.user.fullName;

    // Check if the email is valid
    if (!newEmail.includes("@") || !newEmail.includes(".")) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    // 4
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set: { 
                email: newEmail, 
                fullName: newFullName 
            } 
        },
        { new: true }
    ).select("-password -refreshToken");     
    
    // 5
    return res.status(200).json(new ApiResponse(user, "User details updated successfully", 200));

});

// Function to update user avatar
const updateUserAvatar = asyncHandler(async (req, res, next) => {
    const avatarLocalPath = req.file.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide an avatar image");
    }

    const avatarURL = await uploadToCloudinary(avatarLocalPath);
    if (!avatarURL) {
        throw new ApiError(500, "An error occurred while uploading the image");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set: { 
                avatar: avatarURL 
            } 
        },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(user, "User avatar updated successfully", 200));
});

// Function to update user cover image
const updateUserCoverImage = asyncHandler(async (req, res, next) => {
    const coverImageLocalPath = req.file.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please provide a cover image");
    }

    const coverImageURL = await uploadToCloudinary(coverImageLocalPath);
    if (!coverImageURL) {
        throw new ApiError(500, "An error occurred while uploading the image");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { 
            $set: { 
                coverImage: coverImageURL 
            } 
        },
        { new: true }
    ).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(user, "User cover image updated successfully", 200));
});

// Export the functions to be used in the routes
export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage
};

// Helper function to generate access and refresh tokens
async function generateAccessAndRefreshTokens(userId){
    // Steps to generate access and refresh tokens
    // 1. Generate a new access token using the user object
    // 2. Generate a new refresh token using the user object
    // 3. Save the refresh token in the database
    // 4. Return the access token and refresh token

    try {
        // 0
        const user = await User.findById(userId);
        // 1
        const accessToken = user.generateAccessToken();
        // 2
        const refreshToken = user.generateRefreshToken();
        // 3
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        // 4
        return { accessToken, refreshToken }
        
    } catch (error) {
        throw new ApiError(500, "An error occurred while generating tokens");
    } 
}