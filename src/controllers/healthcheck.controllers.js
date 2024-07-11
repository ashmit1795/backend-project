import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse("success", "API is up and running", 200));
});

export { healthCheck };