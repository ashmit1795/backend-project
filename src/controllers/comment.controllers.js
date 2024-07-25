import { Comment } from '../models/comment.models.js';
import { Video } from "../models/video.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from 'mongoose';

// Get all comments for a video
const getVideoComments = asyncHandler(async (req, res, next) => {
    const { videoId }  = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    // If video does not exist
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found or is not published");
    }
    // If video is not published
    if (!video.isPublished) {
        throw new ApiError(403, "Video is not published");
    }

    const aggregateQuery = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            },
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $project: {
                content: 1,
                video: 1,
                owner: 1,
                createdAt: 1
            }
        },
        {
            $skip: parseInt((page - 1)*limit, 10)
        },
        {
            $limit: parseInt(limit, 10)
        }
    ]);

    if (!aggregateQuery || aggregateQuery.length === 0 ) {
        throw new ApiError(404, "No comments found");
    }

    return res.status(200).json(new ApiResponse(aggregateQuery, "Comments retrieved successfully", 200));
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res, next) => {
    const { videoId }  = req.params;
    const { content } = req.body;
    const owner = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    if (!content.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner,
    });

    if (!newComment) {
        throw new ApiError(500, "Comment could not be created");
    }

    return res.status(201).json(new ApiResponse(newComment, "Comment created successfully", 201));
});

// Update a comment
const updateComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;
    const { newContent } = req.body;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!newContent.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, 
        { 
            content: newContent 
        }, 
        { 
            new: true 
        }
    );

    if (!updatedComment) {
        throw new ApiError(500, "Comment could not be updated");
    }

    return res.status(200).json(new ApiResponse(updatedComment, "Comment updated successfully", 200));

});

// Delete a comment
const deleteComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    try {
        await Comment.findByIdAndDelete(commentId)
    } catch (error) {
        throw new ApiError(500, "Comment could not be deleted");
        
    };

    return res.status(200).json(new ApiResponse({}, "Comment deleted successfully", 200));
}); 

export { getVideoComments, addComment, updateComment, deleteComment };