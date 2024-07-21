import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// Create a new tweet
const createTweet = asyncHandler(async (req, res, next) => {
    const { content } = req.body;
    if (!content.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content,
    });

    if (!tweet) {
        throw new ApiError(500, "Tweet could not be created");
    }

    return res.status(201).json(new ApiResponse(tweet, "Tweet created successfully", 201 ));
});

// Get all tweets
const getUserTweets = asyncHandler(async (req, res, next) => {
    const username = req.params.username;
    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    const user = await User.findOne({ username : username });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tweets = await Tweet.find({ owner: user._id });

    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found");
    }

    return res.status(200).json(new ApiResponse(tweets, "Tweets retrieved successfully", 200));

});

// Update a tweet
const updateTweet = asyncHandler(async (req, res, next) => {
    const tweetId = req.params.tweetId;
    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }
    const { newContent } = req.body;
    if (!newContent.trim()) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        { 
            $set:{
                content: newContent
            },
        }, { 
            new: true 
        }
    );

    if (!updatedTweet) {
        throw new ApiError(500, "Tweet could not be updated");
    }

    return res.status(200).json(new ApiResponse(updatedTweet, "Tweet updated successfully", 200));

});

// Delete a tweet
const deleteTweet = asyncHandler(async (req, res, next) => {
    const tweetId = req.params.tweetId;
    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const result = await Tweet.findByIdAndDelete(tweetId);
    console.log(result);
    if (!result) {
        throw new ApiError(500, "Tweet could not be deleted");
    }

    return res.status(200).json(new ApiResponse({ deletedTweet : result}, "Tweet deleted successfully", 200));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };