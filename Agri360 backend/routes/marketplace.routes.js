import express from "express";
import marketplaceController from "../controllers/marketplace.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Listings
router.post("/listings", protect, marketplaceController.createListing);
router.get("/listings", marketplaceController.listListings);
router.get("/listings/my", protect, marketplaceController.getMyListings);
router.get("/listings/:id", marketplaceController.getListing);
router.put("/listings/:id", protect, marketplaceController.updateListing);
router.delete("/listings/:id", protect, marketplaceController.deleteListing);

// Plan-linked listings
router.post(
  "/listings/from-plan",
  protect,
  marketplaceController.createListingFromPlan
);

// AI Analysis
router.post(
  "/listings/:id/refresh-analysis",
  protect,
  marketplaceController.refreshAIAnalysis
);

// Bidding
router.post("/listings/:id/bid", protect, marketplaceController.placeBid);
router.post(
  "/listings/:id/bid/respond",
  protect,
  marketplaceController.respondToBid
);

// Orders
router.post("/orders", protect, marketplaceController.createOrder);
router.get("/orders/:id", protect, marketplaceController.getOrder);
router.put(
  "/orders/:id/status",
  protect,
  marketplaceController.updateOrderStatus
);
router.post(
  "/orders/:id/rating",
  protect,
  marketplaceController.addOrderRating
);

export default router;
