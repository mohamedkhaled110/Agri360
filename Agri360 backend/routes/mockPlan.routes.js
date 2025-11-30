import express from "express";
import { createSimpleBusinessPlan } from "../controllers/mockPlan.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Mock business plan - works without external AI API
router.post("/mock", protect, createSimpleBusinessPlan);

export default router;
