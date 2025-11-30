import express from "express";
import { createSimplePlan } from "../controllers/simplePlan.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Simple business plan - for debugging (skips all data aggregation)
router.post("/simple", protect, createSimplePlan);

export default router;
