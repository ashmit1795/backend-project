import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Like } from "../models/like.models.js";
import { Tweet } from "../models/tweet.models.js";
import { Subscription } from "../models/subscription.models.js";

// Get channel stats
const getChannelStats = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -refreshToken -watchHistory");

    // Get videos details like total number of videos, total number of views, total number of likes
    const videoStats = await Video.aggregate([
        {
            $match: { 
                owner: userId 
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" }, // Like count of each video
                commentCount: { $size: "$comments" } // Comment count of each video
            }
        },
        {
            $group:{
                _id: null,
                totalLikes: { $sum: "$likeCount" },
                totalComments: { $sum: "$commentCount" },
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
            }
        },
        {
            $project: {
                _id: 0,
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1,
                totalComments: 1
            }
        }
    ]);

    // Get tweets details like total number of tweets, total number of likes
    const tweetStats = await Tweet.aggregate([
        {
            $match: { 
                owner: userId 
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" }, // Like count of each tweet
            }
        },
        {
            $group:{
                _id: null,
                totalLikes: { $sum: "$likeCount" },
                totalTweets: { $sum: 1 },
            }
        },
        {
            $project: {
                _id: 0,
                totalTweets: 1,
                totalLikes: 1,
            }
        }
    ]);

    // Get total number of subscribers
    const subscribersStats = await Subscription.aggregate([
        {
            $match: { 
                channel: userId 
            }
        },
        {
            $group:{
                _id: null,
                totalSubscribers: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalSubscribers: 1
            }
        }
    ]);

    const stats = {
        user,
        videoStats: videoStats[0],
        tweetStats: tweetStats[0],
        totalSubscribers: subscribersStats[0].totalSubscribers
    };

    res.status(200).json(new ApiResponse(stats, "Channel stats retrieved successfully", 200));
});

const getChannelVideos = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const videos = await Video.find({ owner: userId}).select("-_id").populate("owner", "username avatar -_id").sort({ createdAt: -1 });
    if(!videos) {
        throw new ApiError(404, "No videos found");
    }

    res.status(200).json(new ApiResponse(videos, "Channel videos retrieved successfully", 200));
});

export { getChannelStats, getChannelVideos };