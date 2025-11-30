import express from "express";
import harvestController from "../controllers/harvestPlan.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// CRUD operations
router.post("/", protect, harvestController.createHarvestPlan);
router.get("/", protect, harvestController.listHarvestPlans);
router.get("/tasks", protect, harvestController.getUpcomingTasks);
router.get("/:id", protect, harvestController.getHarvestPlan);
router.put("/:id", protect, harvestController.updateHarvestPlan);
router.delete("/:id", protect, harvestController.deleteHarvestPlan);

export default router;
