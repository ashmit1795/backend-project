import { Router } from "express";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";

const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes
router.route("/c/:channelId").get(getUserChannelSubscribers).post(toggleSubscription);
router.route("/u/:subscriberId").get(getSubscribedChannels);
export default router;