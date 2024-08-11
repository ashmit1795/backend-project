import { Router } from "express";
import { deleteVideo, getAllVideos, publishVideo, togglePublishStatus, updateVideo, viewVideo } from "../controllers/video.controllers.js";
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
).get(getAllVideos);

router.route("/view/:videoId").patch(viewVideo);
router.route("/:videoId").patch(upload.single("thumbnail"), updateVideo).delete(deleteVideo);
router.route("/toggle-publish-status/:videoId").patch(togglePublishStatus);

export default router;