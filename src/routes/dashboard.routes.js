import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";

const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes
router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);
export default router;