import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelDetails, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserDetails } from "../controllers/user.controllers.js";
import upload from "../middlewares/multer.middlewares.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// Secured routes
router.route("/logout").post(verifyAccessToken, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyAccessToken, changeCurrentPassword, logoutUser);
router.route("/my-profile").get(verifyAccessToken, getCurrentUser);
router.route("/update-profile").patch(verifyAccessToken, updateUserDetails);
router.route("/update-avatar").patch(verifyAccessToken, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover-image").patch(verifyAccessToken, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:username").get(verifyAccessToken, getUserChannelDetails);
router.route("/watch-history").get(verifyAccessToken, getWatchHistory);

export default router;