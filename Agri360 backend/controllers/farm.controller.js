import Farm from "../models/Farm.js";
import User from "../models/User.js";
import HarvestPlan from "../models/HarvestPlan.js";
import BusinessPlan from "../models/BusinessPlan.js";
import soilService from "../services/soilService.js";
import waterService from "../services/waterService.js";
import weatherService from "../services/weatherService.js";
import { t } from "../utils/translator.js";

// ========== FARM CRUD ==========

export const createFarm = async (req, res) => {
  try {
    const data = req.body;
    data.owner = req.user._id;
    const farm = await Farm.create(data);
    // attach to user
    await User.findByIdAndUpdate(req.user._id, { farm: farm._id });

    // Track activity
    await User.findByIdAndUpdate(req.user._id, {
      "activity.lastActive": new Date(),
    });

    res.status(201).json({ farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const getFarm = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id || req.user.farm);
    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });
    res.json({ farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateFarm = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const updates = req.body;

    const farm = await Farm.findByIdAndUpdate(farmId, updates, { new: true });
    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== SOIL MANAGEMENT ==========

export const analyzeSoil = async (req, res) => {
  try {
    const { soil } = req.body;
    const r = await soilService.analyzeSoil(soil);
    res.json(r);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateSoilData = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const { soil } = req.body;

    // Add test date
    soil.lastTestDate = new Date();

    const farm = await Farm.findByIdAndUpdate(farmId, { soil }, { new: true });

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    // Also run analysis
    const analysis = await soilService.analyzeSoil(soil);

    res.json({ farm, analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== WATER MANAGEMENT ==========

export const getWaterAnalysis = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const farm = await Farm.findById(farmId);

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    const waterAnalysis = await waterService.analyzeWater(farm.water);
    res.json({ water: farm.water, analysis: waterAnalysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const analyzeWater = async (req, res) => {
  try {
    const { waterSource, quality, ph } = req.body;
    const analysis = await waterService.analyzeWater({
      source: waterSource,
      quality,
      ph,
    });
    res.json({ analysis, recommendations: analysis.recommendations || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateWaterData = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const { water } = req.body;

    const farm = await Farm.findByIdAndUpdate(farmId, { water }, { new: true });

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== CROP HISTORY ==========

export const getCropHistory = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const farm = await Farm.findById(farmId).select("cropHistory");

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ cropHistory: farm.cropHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const addCropHistory = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const cropEntry = req.body;

    const farm = await Farm.findByIdAndUpdate(
      farmId,
      { $push: { cropHistory: cropEntry } },
      { new: true }
    );

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ cropHistory: farm.cropHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== ANIMAL MANAGEMENT ==========

export const getAnimals = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const farm = await Farm.findById(farmId).select("animals");

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ animals: farm.animals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const addAnimal = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const animalData = req.body;

    const farm = await Farm.findByIdAndUpdate(
      farmId,
      { $push: { animals: animalData } },
      { new: true }
    );

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ animals: farm.animals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateAnimal = async (req, res) => {
  try {
    const farmId = req.params.farmId || req.user.farm;
    const animalId = req.params.animalId;
    const updates = req.body;

    const farm = await Farm.findOneAndUpdate(
      { _id: farmId, "animals._id": animalId },
      { $set: { "animals.$": { ...updates, _id: animalId } } },
      { new: true }
    );

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ animals: farm.animals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const deleteAnimal = async (req, res) => {
  try {
    const farmId = req.params.farmId || req.user.farm;
    const animalId = req.params.animalId;

    const farm = await Farm.findByIdAndUpdate(
      farmId,
      { $pull: { animals: { _id: animalId } } },
      { new: true }
    );

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ animals: farm.animals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== PLAN HISTORY ==========

export const getPlanHistory = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const farm = await Farm.findById(farmId);

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    // Fetch all plans associated with this farm
    const [harvestPlans, businessPlans] = await Promise.all([
      HarvestPlan.find({ farm: farmId }).sort({ createdAt: -1 }).lean(),
      BusinessPlan.find({ farm: farmId }).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      harvestPlans,
      businessPlans,
      summary: {
        totalHarvestPlans: harvestPlans.length,
        totalBusinessPlans: businessPlans.length,
        activePlans: [
          ...harvestPlans.filter((p) => p.status === "active"),
          ...businessPlans.filter((p) => p.status === "active"),
        ].length,
        completedPlans: [
          ...harvestPlans.filter((p) => p.status === "completed"),
          ...businessPlans.filter((p) => p.status === "completed"),
        ].length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== FARM SUMMARY FOR AI ==========

export const getFarmSummaryForAI = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const farm = await Farm.findById(farmId);

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    // Get weather for farm location
    let weather = null;
    if (farm.location?.lat && farm.location?.lon) {
      weather = await weatherService.getForecastForFarm({
        location: farm.location,
      });
    }

    // Build comprehensive summary for AI
    const summary = {
      farmProfile: {
        name: farm.name,
        location: farm.location,
        fieldSizeHectares: farm.fieldSizeHectares,
        preferences: farm.preferences,
      },
      soil: farm.soil,
      water: farm.water,
      cropHistory: farm.cropHistory?.slice(-5) || [], // Last 5 crops
      animals: farm.animals || [],
      hasAnimals: farm.animals?.length > 0,
      infrastructure: farm.infrastructure,
      weather: weather,
    };

    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== PREFERENCES ==========

export const updatePreferences = async (req, res) => {
  try {
    const farmId = req.params.id || req.user.farm;
    const { preferences } = req.body;

    const farm = await Farm.findByIdAndUpdate(
      farmId,
      { preferences },
      { new: true }
    );

    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ farm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export default {
  createFarm,
  getFarm,
  updateFarm,
  analyzeSoil,
  updateSoilData,
  getWaterAnalysis,
  analyzeWater,
  updateWaterData,
  getCropHistory,
  addCropHistory,
  getAnimals,
  addAnimal,
  updateAnimal,
  deleteAnimal,
  getPlanHistory,
  getFarmSummaryForAI,
  updatePreferences,
};
