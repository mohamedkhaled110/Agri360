import express from "express";
import dashboardController from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// General stats (can be public or protected)
router.get("/", protect, dashboardController.getStats);

// Compute and store new stats
router.post("/compute", protect, dashboardController.computeAndStore);

// User-specific dashboard
router.get("/user", protect, dashboardController.getUserDashboard);

// Refresh dashboard data
router.post("/refresh", protect, dashboardController.refreshDashboard);

export default router;
