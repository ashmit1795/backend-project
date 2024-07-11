import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controllers.js";

const router = Router();

// Define routes
router.route("/").get(healthCheck);

export default router;