import express from "express";
import userController from "../controllers/user.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Profile
router.get("/me", protect, userController.getProfile);
router.put("/me", protect, userController.updateProfile);

// Preferences
router.get("/preferences", protect, userController.getPreferences);
router.put("/preferences", protect, userController.updatePreferences);

// Notification settings
router.get(
  "/notification-settings",
  protect,
  userController.getNotificationSettings
);
router.put(
  "/notification-settings",
  protect,
  userController.updateNotificationSettings
);

// Notifications
router.get("/notifications", protect, userController.getNotifications);
router.put(
  "/notifications/:id/read",
  protect,
  userController.markNotificationRead
);
router.put(
  "/notifications/read-all",
  protect,
  userController.markAllNotificationsRead
);

// Plan statistics
router.get("/plan-stats", protect, userController.getPlanStatistics);

// Activity
router.get("/activity", protect, userController.getActivity);

// Orders
router.get("/orders", protect, userController.getMyOrders);

// Dashboard summary
router.get("/dashboard", protect, userController.getDashboardSummary);

export default router;
