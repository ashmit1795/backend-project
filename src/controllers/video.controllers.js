import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { deleteFileFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { mongo } from "mongoose";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";

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

// Get all videos based on the query parameters
const getAllVideos = asyncHandler(async(req, res, next) =>{
    const { page = 1, limit = 10, query="", tag="", sortBy = "createdAt", sortType = "desc", userId } = req.query;
    let sortOrder = sortType === "asc" ? 1 : -1;
    const basePipeline = [
        {
            $match: {
                isPublished: true
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner: {
                    $arrayElemAt: ["$owner", 0]
                }
            }
        },
        {
            $sort:{
                [sortBy]: sortOrder
            }
        },
        {
            $skip: parseInt((page - 1)*limit, 10)
        },
        {
            $limit: parseInt(limit, 10)
        }
    ];
    if(!(query === "" && tag === "")){
        basePipeline.unshift(
            {
                $match: {
                    $text: {
                        $search: String(query)
                    },
                    tags:{
                        $regex: tag,
                        $options: "i"
                    }
                }
            }
        );
    }
    const result = await Video.aggregate(basePipeline);
    if(!result || result.length === 0){
        throw new ApiError(404, "No videos found based on the query parameters");
    }
    res.status(200).json(
        new ApiResponse(result[0], "Videos fetched successfully", 200)
    );
});

// View a video
const viewVideo = asyncHandler(async(req, res, next) =>{
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(!video.isPublished){
        throw new ApiError(403, "Video is not published");
    }

     // Update the user's watch history
     const updatedUser = await User.findByIdAndUpdate(req.user._id, {
        $push: {
            watchHistory: videoId
        }
    }, { new: true});

    // Update the views of the video
    const views = await calculateUniqueVideoViews(videoId);
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        views: views
    }, { new: true });

   
 

    res.status(200).json(
        new ApiResponse(updatedVideo, "Video viewed successfully", 200)
    );
});

// Update a video
const updateVideo = asyncHandler(async(req, res, next) =>{
    const { videoId } = req.params;
    const { title, description, tags } = req.body;

    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update this video");
    }

    if(!title.trim() && !description.trim() && !tags){
        throw new ApiError(400, "At least one field is required to update the video");
    }


    let newTitle = title.trim() ? title : video.title;
    let newDescription = description.trim() ? description : video.description;
    let newTags = tags ? tags.split(",").map(tag => tag.trim()) : video.tags;

    let thumbnailLocalPath = req.file ? req.file.path : undefined;
    let currentThumbnail = video.thumbnail;
    let thumbnailUploadResponse;

    if(thumbnailLocalPath){
        thumbnailUploadResponse = await uploadToCloudinary(thumbnailLocalPath);
        if(!thumbnailUploadResponse.url){
            throw new ApiError(500, "An error occurred while uploading the thumbnail");
        }
        if(thumbnailUploadResponse){
            await deleteFileFromCloudinary(currentThumbnail);
        }
    }

    let newThumbnail = thumbnailUploadResponse ? thumbnailUploadResponse.url : currentThumbnail;

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        title: newTitle,
        description: newDescription,
        tags: newTags,
        thumbnail: newThumbnail
    }, { new: true });

    if(!updatedVideo){
        throw new ApiError(500, "An error occurred while updating the video");
    }

    res.status(200).json(
        new ApiResponse(updatedVideo, "Video updated successfully", 200)
    );

});

// Delete a video
const deleteVideo = asyncHandler(async(req, res, next) =>{
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update this video");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if(!deletedVideo){
        throw new ApiError(500, "An error occurred while deleting the video");
    }

    await deleteFileFromCloudinary(deletedVideo.videoFile);
    await deleteFileFromCloudinary(deletedVideo.thumbnail);
    let deletedWatchHistory = await User.updateMany(
        {
            watchHistory: videoId
        }, 
        {
            $pull: {
                watchHistory: videoId
            }
        },
        { new: true }
    );

    let deletedComments =  await Comment.deleteMany({
        video: videoId
    }, { new: true });

    console.log(deletedWatchHistory, deletedComments);

    res.status(200).json(
        new ApiResponse({}, "Video deleted successfully", 200)
    );
    
});

// Toggle the publish status of a video
const togglePublishStatus = asyncHandler(async(req, res, next) =>{
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update this video");
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        isPublished: !video.isPublished
    }, { new: true });

    if(!updatedVideo){
        throw new ApiError(500, "An error occurred while updating the video");
    }

    res.status(200).json(
        new ApiResponse(updatedVideo, "Video publish status updated successfully", 200)
    );

});

export { publishVideo, getAllVideos, viewVideo, updateVideo, deleteVideo, togglePublishStatus }

// Calculate views for a particular video
const calculateUniqueVideoViews = async (videoId) =>{
    try {
        const videoObjectId = new mongoose.Types.ObjectId(videoId);
        const uniqueViewsCount = await User.aggregate([
            {
                $unwind: "$watchHistory"
            },
            {
                $match:{
                    watchHistory: videoObjectId
                }
            },
            {
                $group:{
                    _id: {
                        videoId: "$watchHistory",
                        userId: "$_id"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group:{
                    _id: "$_id.videoId",
                    uniqueViews: {
                        $sum: 1
                    }
                }
            }
        ]);

        const uniqueViews = uniqueViewsCount.length > 0 ? uniqueViewsCount[0].uniqueViews : 0;
        return uniqueViews;
    } catch (error) {
        new ApiError(500, error.message || "An error occurred while calculating unique views");
    }
};