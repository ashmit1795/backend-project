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
    // Steps to get all videos
    // 1. Get the query parameters from the request query
    // 2. Get the page, limit, query, tag, sortBy, sortType, and userId from the query parameters
    // 3. Set the sortOrder based on the sortType
    // 4. Create a base pipeline for the aggregation
    // 5. Check if the query and tag are not empty. If not, add a match stage to the pipeline
    // 6. Aggregate the videos based on the pipeline
    // 7. Check if the result is empty. If so, throw an error
    // 8. Return the result as a response

    // 1,2
    const { page = 1, limit = 10, query="", tag="", sortBy = "createdAt", sortType = "desc", userId } = req.query;
    // 3
    let sortOrder = sortType === "asc" ? 1 : -1;
    // 4
    // Base pipeline to get all videos
    // 1. Match videos that are published
    // 2. Lookup the owner of the video
    // 3. Project the owner fields
    // 4. Sort the videos based on the sortBy field
    // 5. Skip the videos based on the page and limit
    // 6. Limit the videos based on the limit
    // 7. If the query and tag are not empty, add a match stage to the pipeline
    // 8. Match the videos based on the query and tag
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
    // 5
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
    // 6
    const result = await Video.aggregate(basePipeline);
    // 7
    if(!result || result.length === 0){
        throw new ApiError(404, "No videos found based on the query parameters");
    }

    // 8
    res.status(200).json(
        new ApiResponse(result[0], "Videos fetched successfully", 200)
    );
});

// View a video
const viewVideo = asyncHandler(async(req, res, next) =>{
    // Steps
    // 1. Get the videoId from the request params
    // 2. Check if the videoId is not empty
    // 3. Find the video based on the videoId
    // 4. Check if the video is not found. If so, throw an error
    // 5. Check if the video is not published. If so, throw an error
    // 6. Update the user's watch history
    // 7. Calculate the unique views for the video
    // 8. Update the video's views
    // 9. Return the updated video as a response

    // 1,2
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }

    // 3
    const video = await Video.findById(videoId);

    // 4,5
    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(!video.isPublished){
        throw new ApiError(403, "Video is not published");
    }

     // 6 Update the user's watch history
     const updatedUser = await User.findByIdAndUpdate(req.user._id, {
        $push: {
            watchHistory: videoId
        }
    }, { new: true});

    // 7
    const views = await calculateUniqueVideoViews(videoId);
    // 8 Update the unique views of the video
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        views: views
    }, { new: true });

    res.status(200).json(
        new ApiResponse(updatedVideo, "Video viewed successfully", 200)
    );
});

// Update a video
const updateVideo = asyncHandler(async(req, res, next) =>{
    // Steps
    // 1. Get the videoId from the request params
    // 2. Get the title, description, and tags from the request body
    // 3. Check if the videoId is not empty
    // 4. Find the video based on the videoId
    // 5. Check if the video is not found. If so, throw an error
    // 6. Check if the user is the owner of the video. If not, throw an error
    // 7. Check if the title, description, and tags are empty. If so, throw an error
    // 8. Check if the thumbnail is uploaded. If so, upload the thumbnail to cloudinary
    // 9. Check if the thumbnail is uploaded successfully. If not, throw an error
    // 10. Update the video with the new title, description, tags, and thumbnail
    // 11. Check if the video is updated successfully. If not, throw an error
    // 12. Return the updated video as a response

    // 1,2
    const { videoId } = req.params;
    const { title, description, tags } = req.body;

    // 3
    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }

    // 4,5
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    // 6
    isOwner(video, req.user._id);

    // 7
    if(!title.trim() && !description.trim() && !tags){
        throw new ApiError(400, "At least one field is required to update the video");
    }


    let newTitle = title.trim() ? title : video.title;
    let newDescription = description.trim() ? description : video.description;
    let newTags = tags ? tags.split(",").map(tag => tag.trim()) : video.tags;

    // 8
    let thumbnailLocalPath = req.file ? req.file.path : undefined;
    let currentThumbnail = video.thumbnail;
    let thumbnailUploadResponse;

    if(thumbnailLocalPath){
        thumbnailUploadResponse = await uploadToCloudinary(thumbnailLocalPath);
        // 9
        if(!thumbnailUploadResponse.url){
            throw new ApiError(500, "An error occurred while uploading the thumbnail");
        }
        if(thumbnailUploadResponse){
            await deleteFileFromCloudinary(currentThumbnail);
        }
    }

    let newThumbnail = thumbnailUploadResponse ? thumbnailUploadResponse.url : currentThumbnail;

    // 10
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        title: newTitle,
        description: newDescription,
        tags: newTags,
        thumbnail: newThumbnail
    }, { new: true });

    // 11
    if(!updatedVideo){
        throw new ApiError(500, "An error occurred while updating the video");
    }

    // 12
    res.status(200).json(
        new ApiResponse(updatedVideo, "Video updated successfully", 200)
    );

});

// Delete a video
const deleteVideo = asyncHandler(async(req, res, next) =>{
    // Steps
    // 1. Get the videoId from the request params
    // 2. Check if the videoId is not empty
    // 3. Find the video based on the videoId
    // 4. Check if the video is not found. If so, throw an error
    // 5. Check if the user is the owner of the video. If not, throw an error
    // 6. Delete the video from the database
    // 7. Check if the video is deleted successfully. If not, throw an error
    // 8. Delete the video file and thumbnail from cloudinary
    // 9. Delete the video from the user's watch history
    // 10. Delete the comments of the video
    // 11. Return a success response

    // 1,2
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }

    // 3,4
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    // 5
    isOwner(video, req.user._id);

    // 6,7
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if(!deletedVideo){
        throw new ApiError(500, "An error occurred while deleting the video");
    }

    // 8
    await deleteFileFromCloudinary(deletedVideo.videoFile);
    await deleteFileFromCloudinary(deletedVideo.thumbnail);

    // 9
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

    // 10
    let deletedComments =  await Comment.deleteMany({
        video: videoId
    }, { new: true });

    // console.log(deletedWatchHistory, deletedComments);

    // 11
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

    isOwner(video, req.user._id);

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

// To check if the user is the owner of the video
const isOwner = (video, userId) =>{
    if(video.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You are not allowed to perform this action");
    }
};