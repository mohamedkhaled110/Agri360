import * as service from "../services/businessPlan.service.js";
import BusinessPlan from "../models/BusinessPlan.js";
import { t } from "../utils/translator.js";

/**
 * Generate default phases based on plan type
 * Each plan type has unique phases tailored to its purpose
 */
const generateDefaultPhases = (planType, language = "en") => {
  const now = new Date();
  const phases = [];

  const phaseTemplates = {
    // FARMING PLAN - For crop cultivation
    farming: [
      {
        nameEn: "Land Preparation",
        nameAr: "تجهيز الأرض",
        descEn: "Prepare soil, clear land, set up irrigation",
        descAr: "تجهيز التربة، تنظيف الأرض، إعداد نظام الري",
        weeks: 2,
      },
      {
        nameEn: "Planting",
        nameAr: "الزراعة",
        descEn: "Seed/seedling planting and initial care",
        descAr: "زراعة البذور/الشتلات والرعاية الأولية",
        weeks: 2,
      },
      {
        nameEn: "Growth & Maintenance",
        nameAr: "النمو والصيانة",
        descEn: "Fertilization, pest control, irrigation management",
        descAr: "التسميد، مكافحة الآفات، إدارة الري",
        weeks: 8,
      },
      {
        nameEn: "Harvest",
        nameAr: "الحصاد",
        descEn: "Harvesting, sorting, and initial storage",
        descAr: "الحصاد، الفرز، والتخزين الأولي",
        weeks: 2,
      },
    ],
    // Same as farming
    crop: [
      {
        nameEn: "Soil & Seed Preparation",
        nameAr: "تجهيز التربة والبذور",
        descEn: "Soil testing, seed selection, land preparation",
        descAr: "اختبار التربة، اختيار البذور، تجهيز الأرض",
        weeks: 2,
      },
      {
        nameEn: "Planting Season",
        nameAr: "موسم الزراعة",
        descEn: "Planting, initial irrigation, early care",
        descAr: "الزراعة، الري الأولي، الرعاية المبكرة",
        weeks: 2,
      },
      {
        nameEn: "Crop Management",
        nameAr: "إدارة المحصول",
        descEn: "Fertilization, pest control, growth monitoring",
        descAr: "التسميد، مكافحة الآفات، مراقبة النمو",
        weeks: 10,
      },
      {
        nameEn: "Harvest & Storage",
        nameAr: "الحصاد والتخزين",
        descEn: "Harvesting, quality sorting, storage",
        descAr: "الحصاد، فرز الجودة، التخزين",
        weeks: 2,
      },
    ],
    // BUSINESS PLAN - For investment strategies (buying animals, equipment, etc.)
    business: [
      {
        nameEn: "Research & Planning",
        nameAr: "البحث والتخطيط",
        descEn: "Market research, cost analysis, supplier identification",
        descAr: "بحث السوق، تحليل التكاليف، تحديد الموردين",
        weeks: 2,
      },
      {
        nameEn: "Investment & Acquisition",
        nameAr: "الاستثمار والشراء",
        descEn: "Purchase assets, animals, or equipment as planned",
        descAr: "شراء الأصول، الحيوانات، أو المعدات كما مخطط",
        weeks: 2,
      },
      {
        nameEn: "Setup & Operations",
        nameAr: "الإعداد والتشغيل",
        descEn: "Set up facilities, start operations, initial management",
        descAr: "إعداد المرافق، بدء العمليات، الإدارة الأولية",
        weeks: 4,
      },
      {
        nameEn: "Growth & Optimization",
        nameAr: "النمو والتحسين",
        descEn: "Monitor performance, optimize operations, scale up",
        descAr: "مراقبة الأداء، تحسين العمليات، التوسع",
        weeks: 8,
      },
    ],
    // MARKET PLAN - For selling products
    market: [
      {
        nameEn: "Market Research",
        nameAr: "بحث السوق",
        descEn: "Identify buyers, analyze prices, study competition",
        descAr: "تحديد المشترين، تحليل الأسعار، دراسة المنافسة",
        weeks: 1,
      },
      {
        nameEn: "Product Preparation",
        nameAr: "تجهيز المنتج",
        descEn: "Sorting, grading, packaging, quality control",
        descAr: "الفرز، التصنيف، التعبئة، مراقبة الجودة",
        weeks: 2,
      },
      {
        nameEn: "Marketing & Sales",
        nameAr: "التسويق والمبيعات",
        descEn: "Advertise, negotiate with buyers, execute sales",
        descAr: "الإعلان، التفاوض مع المشترين، تنفيذ المبيعات",
        weeks: 3,
      },
      {
        nameEn: "Delivery & Payment",
        nameAr: "التوصيل والدفع",
        descEn: "Transport products, collect payments, follow up",
        descAr: "نقل المنتجات، تحصيل المدفوعات، المتابعة",
        weeks: 2,
      },
    ],
    // ANIMAL PLAN - For livestock management
    animal: [
      {
        nameEn: "Facility Preparation",
        nameAr: "تجهيز المرافق",
        descEn: "Prepare housing, fencing, feeding systems",
        descAr: "تجهيز المساكن، الأسوار، أنظمة التغذية",
        weeks: 2,
      },
      {
        nameEn: "Animal Acquisition",
        nameAr: "شراء الحيوانات",
        descEn: "Source and purchase healthy animals",
        descAr: "البحث عن وشراء حيوانات صحية",
        weeks: 1,
      },
      {
        nameEn: "Care & Management",
        nameAr: "الرعاية والإدارة",
        descEn: "Feeding, health monitoring, breeding if applicable",
        descAr: "التغذية، مراقبة الصحة، التربية إن أمكن",
        weeks: 12,
      },
      {
        nameEn: "Production & Sales",
        nameAr: "الإنتاج والمبيعات",
        descEn: "Harvest products (milk, eggs, meat), sell to market",
        descAr: "حصاد المنتجات (حليب، بيض، لحوم)، البيع للسوق",
        weeks: 4,
      },
    ],
    // MIXED PLAN - Combined operations
    mixed: [
      {
        nameEn: "Integrated Planning",
        nameAr: "التخطيط المتكامل",
        descEn: "Plan crop-animal synergies, resource allocation",
        descAr: "تخطيط التكامل بين المحاصيل والحيوانات، تخصيص الموارد",
        weeks: 2,
      },
      {
        nameEn: "Setup Phase",
        nameAr: "مرحلة الإعداد",
        descEn: "Prepare land, facilities, acquire inputs",
        descAr: "تجهيز الأرض، المرافق، الحصول على المدخلات",
        weeks: 3,
      },
      {
        nameEn: "Production Cycle",
        nameAr: "دورة الإنتاج",
        descEn: "Manage crops and animals, optimize synergies",
        descAr: "إدارة المحاصيل والحيوانات، تحسين التكامل",
        weeks: 12,
      },
      {
        nameEn: "Harvest & Market",
        nameAr: "الحصاد والتسويق",
        descEn: "Collect all products, sell to various markets",
        descAr: "جمع جميع المنتجات، البيع لأسواق متعددة",
        weeks: 3,
      },
    ],
  };

  const template = phaseTemplates[planType] || phaseTemplates.farming;
  let currentDate = new Date(now);

  template.forEach((phase, index) => {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + phase.weeks * 7);

    phases.push({
      name: phase.nameEn,
      nameArabic: phase.nameAr,
      description: phase.descEn,
      descriptionArabic: phase.descAr,
      startDate: startDate,
      endDate: endDate,
      status: index === 0 ? "in-progress" : "pending",
      progress: index === 0 ? 10 : 0,
      tasks: [],
    });

    currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() + 1);
  });

  return phases;
};

/**
 * Safely parse a date, returning null for invalid dates
 * Prevents "Invalid time value" errors
 */
const safeDate = (d) => {
  if (
    d === null ||
    d === undefined ||
    d === "" ||
    d === "null" ||
    d === "undefined" ||
    d === "Invalid Date"
  ) {
    return null;
  }
  try {
    const parsed = d instanceof Date ? d : new Date(d);
    if (isNaN(parsed.getTime())) {
      console.warn("⚠️ Invalid date detected:", d);
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn("⚠️ Date parsing error:", d, err.message);
    return null;
  }
};

/**
 * Sanitize tasks to ensure all dates are valid
 */
const sanitizeTasks = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  return tasks.map((task) => ({
    ...task,
    dueDate: safeDate(task.dueDate) || null,
  }));
};

/**
 * Sanitize phases to ensure all dates are valid
 */
const sanitizePhases = (phases) => {
  if (!Array.isArray(phases)) return [];

  console.log("🔍 Sanitizing", phases.length, "phases...");

  return phases.map((phase, index) => {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() + index * 14);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultEnd.getDate() + 14);

    const sanitizedPhase = {
      ...phase,
      startDate: safeDate(phase.startDate) || defaultStart,
      endDate: safeDate(phase.endDate) || defaultEnd,
      tasks: sanitizeTasks(phase.tasks),
    };

    console.log(
      `  Phase ${index + 1}: ${sanitizedPhase.name} - ${
        sanitizedPhase.startDate?.toISOString?.() || "null"
      } to ${sanitizedPhase.endDate?.toISOString?.() || "null"}`
    );

    return sanitizedPhase;
  });
};

/**
 * Simple save plan - saves an already generated plan without calling AI
 * Links to user's farm automatically
 */
export const savePlan = async (req, res) => {
  try {
    console.log("💾 Saving plan (no AI)...");
    const { title, type, content, phases: customPhases, farmId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!content?.plan) {
      return res.status(400).json({ message: "Plan content is required" });
    }

    // Try to get user's farm if farmId not provided
    let linkedFarmId = farmId;
    if (!linkedFarmId) {
      try {
        const Farm = (await import("../models/Farm.js")).default;
        const userFarm = await Farm.findOne({ farmer: userId });
        if (userFarm) {
          linkedFarmId = userFarm._id;
          console.log("🔗 Auto-linked to user's farm:", linkedFarmId);
        }
      } catch (farmErr) {
        console.warn("Could not auto-link farm:", farmErr.message);
      }
    }

    // Sanitize phases to prevent invalid date errors
    const rawPhases = customPhases || generateDefaultPhases(type || "farming");
    const phases = sanitizePhases(rawPhases);

    // Safely get start and end dates with fallbacks
    const startDate = safeDate(phases[0]?.startDate) || new Date();
    const endDate = safeDate(phases[phases.length - 1]?.endDate) || new Date();

    // Calculate duration in months (safely)
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const durationMs = endMs > startMs ? endMs - startMs : 0;
    const durationMonths = Math.max(
      1,
      Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 30))
    );

    // Safely parse approvedAt
    const approvedAt = safeDate(content.approvedAt) || new Date();

    const plan = await BusinessPlan.create({
      farmer: userId,
      farm: linkedFarmId, // Link to user's farm
      title: title || `${type || "farming"} Plan`,
      planType: type || "farming",
      crop: content.crop || "general",
      startDate: startDate,
      endDate: endDate,
      durationMonths: durationMonths,
      phases: phases,
      aiAdvice: {
        fullPlan: content.plan,
        prompt: content.prompt,
        approvedAt: approvedAt.toISOString(),
      },
      status: "approved",
      statusHistory: [
        {
          status: "approved",
          changedAt: new Date(),
          changedBy: userId,
          notes: "Plan approved and saved",
        },
      ],
    });

    console.log("✅ Plan saved successfully:", {
      planId: plan._id,
      userId: userId,
      farmId: linkedFarmId || "none",
      phasesCount: phases.length,
      duration: `${durationMonths} months`,
    });

    res.status(201).json({
      businessPlan: plan,
      message: "Plan saved successfully",
    });
  } catch (err) {
    console.error("❌ Save Plan Error:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const createPlan = async (req, res) => {
  try {
    console.log("📋 Business Plan Request received");
    const data = req.body;
    const lang = req.lang || req.body.lang || "en";

    console.log("Request data:", JSON.stringify(data).substring(0, 200));
    console.log("Language:", lang);
    console.log("User ID:", req.user?.id || req.user?._id);

    // Add farmer ID from authenticated user
    data.farmer = req.user?.id || req.user?._id;

    console.log("Calling service with farmer ID:", data.farmer);

    // Generate business plan via AI service
    const plan = await service.createBusinessPlan(data, lang);

    console.log("✅ Business plan created successfully");

    res.status(201).json({
      businessPlan: plan,
      message: "Business plan generated successfully",
    });
  } catch (err) {
    console.error("❌ BusinessPlan Controller Error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};
export const listPlans = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const filter = { farmer: userId }; // Always filter by logged-in user
    // Optionally allow additional filtering
    if (req.query.status) filter.status = req.query.status;
    if (req.query.planType) filter.planType = req.query.planType;
    const plans = await service.getBusinessPlans(filter);
    console.log(`📋 Found ${plans.length} plans for user ${userId}`);
    res.json({ businessPlans: plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const getPlan = async (req, res) => {
  try {
    const plan = await service.getBusinessPlanById(req.params.id);
    if (!plan)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });
    res.json({ businessPlan: plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    // First verify the plan belongs to this user
    const existingPlan = await service.getBusinessPlanById(req.params.id);
    if (!existingPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Handle populated farmer object or raw ObjectId
    const planFarmerId =
      existingPlan.farmer?._id?.toString() || existingPlan.farmer?.toString();
    const requestUserId = userId?.toString();

    if (planFarmerId !== requestUserId) {
      console.log(
        `❌ Update auth failed: ${planFarmerId} !== ${requestUserId}`
      );
      return res
        .status(403)
        .json({ message: "Not authorized to update this plan" });
    }

    // Add status history if status is changing
    const updates = { ...req.body };
    if (req.body.status && req.body.status !== existingPlan.status) {
      updates.statusHistory = [
        ...(existingPlan.statusHistory || []),
        { status: req.body.status, changedAt: new Date(), changedBy: userId },
      ];
    }

    const updated = await service.updateBusinessPlan(req.params.id, updates);
    console.log(`✅ Plan ${req.params.id} updated by user ${userId}`);
    res.json({ businessPlan: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    console.log(
      `🗑️ Delete request for plan ${req.params.id} by user ${userId}`
    );

    // Verify the plan belongs to this user
    const existingPlan = await service.getBusinessPlanById(req.params.id);
    if (!existingPlan) {
      console.log(`❌ Plan ${req.params.id} not found`);
      return res.status(404).json({ message: "Plan not found" });
    }

    const planFarmerId =
      existingPlan.farmer?._id?.toString() || existingPlan.farmer?.toString();
    const requestUserId = userId?.toString();

    console.log(
      `📋 Plan farmer ID: ${planFarmerId}, Request user ID: ${requestUserId}`
    );

    // Check if user owns the plan OR owns the farm linked to the plan
    let isOwner = planFarmerId === requestUserId;

    if (!isOwner && existingPlan.farm) {
      const farmOwnerId =
        existingPlan.farm?.farmer?._id?.toString() ||
        existingPlan.farm?.farmer?.toString();
      isOwner = farmOwnerId === requestUserId;
      console.log(`📋 Checking farm owner: ${farmOwnerId}`);
    }

    if (!isOwner) {
      console.log(
        `❌ Authorization failed: ${planFarmerId} !== ${requestUserId}`
      );
      return res
        .status(403)
        .json({ message: "Not authorized to delete this plan" });
    }

    await service.deleteBusinessPlan(req.params.id);
    console.log(`✅ Plan ${req.params.id} deleted by user ${userId}`);
    res.status(204).end();
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  savePlan,
  createPlan,
  listPlans,
  getPlan,
  updatePlan,
  deletePlan,
};
