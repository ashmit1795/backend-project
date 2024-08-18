import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Toggle subscription
const toggleSubscription = asyncHandler(async (req, res, next) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const channel = await User.findById(channelId);
    if(!channel) {
        throw new ApiError(404, "Channel not found");
    }

    if(channelId.toString() === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const subscription = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });
    if(subscription){
        const unsubscription = await Subscription.findByIdAndDelete(subscription._id);
        if(!unsubscription) {
            throw new ApiError(500, "Unsubscription failed");
        }
        res.status(200).json(new ApiResponse(null, "Unsubscribed successfully", 200));
    }else{
        const newSubscription = await Subscription.create({ subscriber: subscriberId, channel: channelId });
        if(!newSubscription) {
            throw new ApiError(500, "Subscription failed");
        }
        res.status(200).json(new ApiResponse(null, "Subscribed successfully", 200));
    }
});

// To retrieve subscribers of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res, next) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const channel = await User.findById(channelId);
    if(!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            "username": 1,
                            "avatar": 1,
                            "fullName": 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                "subscriber": {
                    $arrayElemAt: ["$subscriber", 0]
                }
            }
        },
        {
            $project: {
                channel: 0
            }
        }
    ])
    if(!subscribers) {
        throw new ApiError(404, "No subscribers found");
    }

    res.status(200).json(new ApiResponse(subscribers, "Subscribers retrieved successfully", 200));
});

// To retrieve channels subscribed to by a user
const getSubscribedChannels = asyncHandler(async (req, res, next) => {
    const { subscriberId } = req.params;
    if(!subscriberId) {
        throw new ApiError(400, "Subscriber ID is required");
    }

    const subscriber = await User.findById(subscriberId);
    if(!subscriber) {
        throw new ApiError(404, "User not found");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            "username": 1,
                            "avatar": 1,
                            "fullName": 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                "channel": {
                    $arrayElemAt: ["$channel", 0]
                }
            }
        },
        {
            $project:{
                subscriber: 0,
            }
        }
    ]);

    if(!subscriptions) {
        throw new ApiError(404, "No subscriptions found");
    }

    res.status(200).json(new ApiResponse(subscriptions, "Subscriptions retrieved successfully", 200));
});

// Export the functions to be used in the routes
export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };