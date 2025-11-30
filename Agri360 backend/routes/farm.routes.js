import express from "express";
import farmController from "../controllers/farm.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Farm CRUD
router.post("/", protect, farmController.createFarm);
router.get("/my-farm", protect, farmController.getFarm);
router.put("/update", protect, farmController.updateFarm); // Update user's farm (no ID needed)
router.get("/:id", protect, farmController.getFarm);
router.put("/:id", protect, farmController.updateFarm);

// Soil management
router.post("/analyze-soil", protect, farmController.analyzeSoil);
router.put("/:id/soil", protect, farmController.updateSoilData);

// Water management - routes without farmId use user's farm
router.get("/water", protect, farmController.getWaterAnalysis);
router.post("/water/analyze", protect, farmController.analyzeWater);
router.get("/:id/water", protect, farmController.getWaterAnalysis);
router.put("/:id/water", protect, farmController.updateWaterData);

// Crop history
router.get("/crop-history", protect, farmController.getCropHistory); // Uses user's farm
router.get("/:id/crop-history", protect, farmController.getCropHistory);
router.post("/:id/crop-history", protect, farmController.addCropHistory);

// Animal management - routes without farmId use user's farm
router.get("/animals", protect, farmController.getAnimals);
router.post("/animals", protect, farmController.addAnimal);
router.put("/animals/:animalId", protect, farmController.updateAnimal);
router.delete("/animals/:animalId", protect, farmController.deleteAnimal);
// With farmId
router.get("/:id/animals", protect, farmController.getAnimals);
router.post("/:id/animals", protect, farmController.addAnimal);
router.put("/:farmId/animals/:animalId", protect, farmController.updateAnimal);
router.delete(
  "/:farmId/animals/:animalId",
  protect,
  farmController.deleteAnimal
);

// Plan history
router.get("/plans", protect, farmController.getPlanHistory);
router.get("/:id/plans", protect, farmController.getPlanHistory);

// AI summary
router.get("/summary", protect, farmController.getFarmSummaryForAI);
router.get("/:id/summary", protect, farmController.getFarmSummaryForAI);

// Preferences
router.put("/:id/preferences", protect, farmController.updatePreferences);

export default router;
