import { Router } from "express";
import { publishVideo } from "../controllers/video.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes
router.route("/").post(
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "videoFile", maxCount: 1 }
    ]), publishVideo
)

export default router;