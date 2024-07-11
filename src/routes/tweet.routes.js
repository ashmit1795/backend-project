import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";


const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes
router.route("/").post(createTweet);
router.route("/user/:username").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;