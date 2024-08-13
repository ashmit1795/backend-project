import { Router } from "express";
import { getLikedComments, getLikedTweets, getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";


const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes
router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos)
router.route("/comments").get(getLikedComments);
router.route("/tweets").get(getLikedTweets);
export default router;
