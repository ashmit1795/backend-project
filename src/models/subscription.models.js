import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema({
    // subscriber is the user who subscribes to a channel
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // channel is the user whose channel is being subscribed to
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true}); 

export const Subscription = mongoose.model("Subscription", subscriptionSchema);