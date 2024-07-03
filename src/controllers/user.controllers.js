import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import uploadToCloudinary from "../utils/cloudinary.js";

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

export { registerUser };