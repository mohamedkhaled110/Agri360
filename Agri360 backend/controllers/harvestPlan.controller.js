/**
 * Agri360 - Harvest/Crop Plan Controller
 */

import * as harvestService from "../services/harvestPlan.service.js";
import { t } from "../utils/translator.js";

/**
 * Create a new harvest/crop plan
 */
export const createHarvestPlan = async (req, res) => {
  try {
    console.log("📋 Harvest Plan Request received");
    const data = req.body;
    const lang = req.lang || req.body.lang || "en";

    // Add farmer ID from authenticated user
    data.farmer = req.user?.id || req.user?._id;

    console.log("Creating harvest plan for farmer:", data.farmer);

    const plan = await harvestService.createPlan(data, lang);

    res.status(201).json({
      plan,
      message: "Harvest plan created successfully",
    });
  } catch (err) {
    console.error("❌ Harvest plan creation error:", err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * List all harvest plans for the user
 */
export const listHarvestPlans = async (req, res) => {
  try {
    const filter = { farmer: req.user?.id || req.user?._id };

    // Allow filtering by farm
    if (req.query.farmId) {
      filter.farm = req.query.farmId;
    }

    const plans = await harvestService.listPlans(filter);
    res.json({ plans });
  } catch (err) {
    console.error("❌ List harvest plans error:", err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Get a single harvest plan
 */
export const getHarvestPlan = async (req, res) => {
  try {
    const plan = await harvestService.getPlanById(req.params.id);

    if (!plan) {
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });
    }

    // Check ownership
    if (
      plan.farmer._id.toString() !== (req.user?.id || req.user?._id).toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({ plan });
  } catch (err) {
    console.error("❌ Get harvest plan error:", err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Update a harvest plan
 */
export const updateHarvestPlan = async (req, res) => {
  try {
    const plan = await harvestService.updatePlan(req.params.id, req.body);

    if (!plan) {
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });
    }

    res.json({ plan });
  } catch (err) {
    console.error("❌ Update harvest plan error:", err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Delete a harvest plan
 */
export const deleteHarvestPlan = async (req, res) => {
  try {
    await harvestService.deletePlan(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("❌ Delete harvest plan error:", err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

/**
 * Get upcoming tasks
 */
export const getUpcomingTasks = async (req, res) => {
  try {
    const farmerId = req.user?.id || req.user?._id;
    const days = parseInt(req.query.days) || 30;

    const tasks = await harvestService.getUpcomingTasks(farmerId, days);
    res.json({ tasks });
  } catch (err) {
    console.error("❌ Get upcoming tasks error:", err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export default {
  createHarvestPlan,
  listHarvestPlans,
  getHarvestPlan,
  updateHarvestPlan,
  deleteHarvestPlan,
  getUpcomingTasks,
};
