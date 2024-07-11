import { Router } from "express";
import {  } from "../controllers/tweet.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";


const router = Router();

// Secure all routes in this file
// Middleware to verify access token
router.use(verifyAccessToken);

// Define routes

export default router;