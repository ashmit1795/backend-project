import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";
import { Model } from "mongoose";

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    if(!video.isPublished){
        throw new ApiError(403, "Video is not published");
    }

    const response = await toggleLike("video", videoId, req.user.id);
    let totalLikes = await calculateTotalLikes("video", videoId);
    if(response === "Liked"){
        res.status(201).json(
            new ApiResponse({totalLikes: totalLikes}, "Liked", 201));
    } else if(response === "Unliked"){
        res.status(200).json(new ApiResponse({totalLikes: totalLikes}, "Unliked", 200));
    }
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res, next) =>{
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }
    
    const response = await toggleLike("comment", commentId, req.user.id);
    let totalLikes = await calculateTotalLikes("comment", commentId);
    if(response === "Liked"){
        res.status(201).json(new ApiResponse({totalLikes: totalLikes}, "Liked", 201));
    } else if(response === "Unliked"){
        res.status(200).json(new ApiResponse({totalLikes: totalLikes}, "Unliked", 200));
    }

});

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res, next) =>{
    const { tweetId } = req.params;
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }
    
    const response = await toggleLike("tweet", tweetId, req.user.id);
    let totalLikes = await calculateTotalLikes("tweet", tweetId);
    if(response === "Liked"){
        res.status(201).json(new ApiResponse({totalLikes: totalLikes}, "Liked", 201));
    } else if(response === "Unliked"){
        res.status(200).json(new ApiResponse({totalLikes: totalLikes}, "Unliked", 200));
    }
});

// Get all videos liked by a user
const getLikedVideos = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true }}).populate("video");
    console.log(likedVideos);
    if(!likedVideos || likedVideos.length === 0){
        throw new ApiError(404, "No liked videos found");
    }
    return res.status(200).json(new ApiResponse(likedVideos, "Liked videos", 200));
});

// Get all comments liked by a user
const getLikedComments = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const likedComments = await Like.find({ likedBy: userId, comment: { $exists: true }}).populate("comment");
    if(!likedComments || likedComments.length === 0){
        throw new ApiError(404, "No liked comments found");
    }
    return res.status(200).json(new ApiResponse(likedComments, "Liked comments", 200));
});

// Get all tweets liked by a user
const getLikedTweets = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const likedTweets = await Like.find({ likedBy: userId, tweet: { $exists: true }}).populate("tweet");
    if(!likedTweets || likedTweets.length === 0){
        throw new ApiError(404, "No liked tweets found");
    }
    return res.status(200).json(new ApiResponse(likedTweets, "Liked tweets", 200));
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos, getLikedComments, getLikedTweets };

// Function to Toggle Like
const toggleLike = async (resource, resourceId, userId) => {
    const like = await Like.findOne({ [resource]: resourceId, likedBy: userId });
    if(!like){
        const liked = await Like.create({ [resource]: resourceId, likedBy: userId });
        if(!liked){
            throw new ApiError(500, "An error occurred while liking");
        }
        return "Liked";
    } else {
        const unliked = await Like.findByIdAndDelete(like._id);
        if(!unliked){
            throw new ApiError(500, "An error occurred while unliking");
        }
        return "Unliked";
    }
}

const calculateTotalLikes = async (resource, resourceId) => {
    const likes = await Like.find({ [resource]: resourceId });
    return likes.length;
}