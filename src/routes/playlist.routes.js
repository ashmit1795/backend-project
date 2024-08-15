import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";


const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes
router.route("/").post(createPlaylist);
router.route("/:playlistId").get(getPlaylistById).patch(updatePlaylist).delete(deletePlaylist);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylists);

export default router;