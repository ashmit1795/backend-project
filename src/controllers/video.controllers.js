import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

// Publish a video
const publishVideo = asyncHandler(async(req, res, next) =>{

    // Steps to publish a video
    // 1. Get the title and description from the request body
    // 2. Check if the title and description are not empty
    // 3. Check if the videoFile and thumbnail are uploaded. Both are required.
    // 4. Upload the videoFile and thumbnail to cloudinary
    // 5. Check if the videoFile and thumbnail are uploaded successfully. If not, throw an error. 
    // 6. Create a new video document in the database
    // 7. Check if the video is created successfully. If not, throw an error.


    // 1
    const { title, description, tags } = req.body;

    // 2
    if(!title.trim() || !description.trim()){
        throw new ApiError(400, "Title and description are required");
    }

    // 3
    let videoFileLocalPath = req.files.videoFile ? req.files.videoFile[0].path : undefined;
    let thumbnailLocalPath = req.files.thumbnail ? req.files.thumbnail[0].path : undefined;

    if(!videoFileLocalPath || !thumbnailLocalPath){
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    // 4
    let videoFileUploadResponse = await uploadToCloudinary(videoFileLocalPath);
    let thumbnailUploadResponse = await uploadToCloudinary(thumbnailLocalPath);

    // 5
    if (!videoFileUploadResponse.url || !thumbnailUploadResponse.url) {
        throw new ApiError(500, "An error occurred while uploading the video file or thumbnail");
        
    }

    // 6
    const newVideo = await Video.create({
        title,
        description,
        tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
        videoFile: videoFileUploadResponse.url,
        thumbnail: thumbnailUploadResponse.url,
        duration: videoFileUploadResponse.duration,
        owner: req.user._id
    })

    // 7
    const createdVideo = await Video.findById(newVideo._id);
    if (!createdVideo) {
        throw new ApiError(500, "An error occurred while creating the video");
        
    }

    // 8
    res.status(201).json(
        new ApiResponse(createdVideo, "Video published successfully", 201)
    );
    
});

export { publishVideo }