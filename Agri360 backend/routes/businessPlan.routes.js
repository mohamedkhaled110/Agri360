import express from "express";
import controller from "../controllers/businessPlan.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, controller.createPlan);
router.post("/save", protect, controller.savePlan); // Simple save without AI
router.get("/", protect, controller.listPlans);
router.get("/:id", protect, controller.getPlan);
router.put("/:id", protect, controller.updatePlan);
router.delete("/:id", protect, controller.deletePlan);

export default router;
