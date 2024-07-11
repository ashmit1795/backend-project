import { Router } from "express";
import { } from "../controllers/healthcheck.controllers.js";
import { verifyAccessToken } from "../middlewares/auth.middlewares.js";

const router = Router();

// Define routes
router.route("/").get(healthCheck)

export default router;