import { Router } from "express";
import { getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comment.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";

const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes
router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;