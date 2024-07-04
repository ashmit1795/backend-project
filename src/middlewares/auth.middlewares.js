import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ", "");
    if (!accessToken) {
        throw new ApiError(401, "Access token is required");
    }

    try {
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid token");
    }
});