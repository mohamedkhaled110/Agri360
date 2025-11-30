import User from "../models/User.js";
import HarvestPlan from "../models/HarvestPlan.js";
import BusinessPlan from "../models/BusinessPlan.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import { t } from "../utils/translator.js";

// ========== PROFILE ==========

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("farm");

    // Update last active
    await User.findByIdAndUpdate(req.user._id, {
      "activity.lastActive": new Date(),
    });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    // Prevent updating sensitive fields directly
    delete updates.password;
    delete updates.role;
    delete updates.subscription;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== PREFERENCES ==========

export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("preferences");
    res.json({ preferences: user.preferences });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences },
      { new: true }
    ).select("preferences");

    res.json({ preferences: user.preferences });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== NOTIFICATION SETTINGS ==========

export const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "notificationSettings"
    );
    res.json({ notificationSettings: user.notificationSettings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const { notificationSettings } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationSettings },
      { new: true }
    ).select("notificationSettings");

    res.json({ notificationSettings: user.notificationSettings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== NOTIFICATIONS ==========

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

    const query = { user: req.user._id };
    if (unreadOnly === "true") query.read = false;
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });

    res.json({ notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== PLAN STATISTICS ==========

export const getPlanStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const farmId = req.user.farm;

    const [harvestPlans, businessPlans] = await Promise.all([
      HarvestPlan.find({ $or: [{ user: userId }, { farm: farmId }] }).lean(),
      BusinessPlan.find({ $or: [{ user: userId }, { farm: farmId }] }).lean(),
    ]);

    const stats = {
      harvestPlans: {
        total: harvestPlans.length,
        active: harvestPlans.filter((p) => p.status === "active").length,
        completed: harvestPlans.filter((p) => p.status === "completed").length,
        draft: harvestPlans.filter((p) => p.status === "draft").length,
      },
      businessPlans: {
        total: businessPlans.length,
        active: businessPlans.filter((p) => p.status === "active").length,
        completed: businessPlans.filter((p) => p.status === "completed").length,
        draft: businessPlans.filter((p) => p.status === "draft").length,
      },
      recent: [
        ...harvestPlans.slice(-3).map((p) => ({ ...p, planType: "harvest" })),
        ...businessPlans.slice(-3).map((p) => ({ ...p, planType: "business" })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    };

    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== ACTIVITY ==========

export const getActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("activity");
    res.json({ activity: user.activity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== ORDERS ==========

export const getMyOrders = async (req, res) => {
  try {
    const { role = "buyer", status, page = 1, limit = 20 } = req.query;

    const query =
      role === "seller" ? { seller: req.user._id } : { buyer: req.user._id };

    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("listing", "title crop pricePerUnit images")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== DASHBOARD SUMMARY ==========

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const farmId = req.user.farm;

    const [harvestPlans, businessPlans, notifications, buyOrders, sellOrders] =
      await Promise.all([
        HarvestPlan.find({
          $or: [{ user: userId }, { farm: farmId }],
          status: "active",
        }).lean(),
        BusinessPlan.find({
          $or: [{ user: userId }, { farm: farmId }],
          status: "active",
        }).lean(),
        Notification.find({ user: userId, read: false }).countDocuments(),
        Order.find({ buyer: userId }).countDocuments(),
        Order.find({ seller: userId }).countDocuments(),
      ]);

    res.json({
      summary: {
        activePlans: harvestPlans.length + businessPlans.length,
        unreadNotifications: notifications,
        buyOrdersCount: buyOrders,
        sellOrdersCount: sellOrders,
        quickLinks: {
          harvestPlans: harvestPlans.slice(0, 3),
          businessPlans: businessPlans.slice(0, 3),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export default {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
  getNotificationSettings,
  updateNotificationSettings,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPlanStatistics,
  getActivity,
  getMyOrders,
  getDashboardSummary,
};
