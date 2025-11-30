import MarketListing from "../models/MarketListing.js";
import Order from "../models/Order.js";
import HarvestPlan from "../models/HarvestPlan.js";
import Notification from "../models/Notification.js";
import Farm from "../models/Farm.js";
import priceService from "../services/priceService.js";
import { t } from "../utils/translator.js";

// ========== LISTINGS ==========

export const createListing = async (req, res) => {
  try {
    const data = req.body;
    data.farmer = req.user._id;

    // Auto-generate title if not provided
    if (!data.title && data.crop) {
      data.title = `${data.crop} - ${data.quantity || ""} ${
        data.unit || "kg"
      }`.trim();
    }

    // Get farmer's farm for location if not provided
    if (!data.location?.governorate && req.user.farm) {
      const farm = await Farm.findById(req.user.farm);
      if (farm?.location?.governorate) {
        data.location = data.location || {};
        data.location.governorate = farm.location.governorate;
        data.location.city = farm.location.city;
        data.location.lat = farm.location.lat;
        data.location.lon = farm.location.lon;
      }
    }

    // Default governorate if still missing
    if (!data.location?.governorate) {
      data.location = data.location || {};
      data.location.governorate = "Egypt"; // Default
    }

    // Fetch market price suggestion from Mahsoly
    const marketPrices = await priceService.fetchMahsolyPrices(data.crop);
    const suggestedPrice =
      marketPrices.prices?.[0]?.price ||
      marketPrices.price ||
      data.pricePerUnit;

    // AI Analysis for listing
    const aiAnalysis = {
      marketTrend: determineTrend(data.crop, marketPrices),
      pricePrediction: suggestedPrice,
      demandScore: calculateDemandScore(data.crop),
      recommendations: generateListingRecommendations(data, marketPrices),
      lastAnalyzed: new Date(),
    };

    const listing = await MarketListing.create({
      ...data,
      suggestedPrice,
      aiAnalysis,
    });

    res.status(201).json({
      listing,
      marketPriceSuggestion: {
        price: suggestedPrice,
        currency: marketPrices.currency,
        source: marketPrices.source,
      },
      aiAnalysis,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const listListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      crop,
      minPrice,
      maxPrice,
      governorate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { status: "active" };
    if (category) query.category = category;
    if (crop) query.crop = { $regex: crop, $options: "i" };
    if (governorate) query["location.governorate"] = governorate;
    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const listings = await MarketListing.find(query)
      .populate("farmer", "name email phone")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await MarketListing.countDocuments(query);

    // Enrich listings with Mahsoly market price data
    const enrichedListings = await Promise.all(
      listings.map(async (listing) => {
        const mahsolyPrices = await priceService.fetchMahsolyPrices(
          listing.crop
        );
        return {
          ...listing,
          marketPriceData: mahsolyPrices,
          priceComparison: {
            listingPrice: listing.pricePerUnit,
            marketPrice:
              mahsolyPrices.prices?.[0]?.price || mahsolyPrices.price,
            marketCurrency: mahsolyPrices.currency,
            source: mahsolyPrices.source,
            priceDiff: calculatePriceDiff(listing.pricePerUnit, mahsolyPrices),
          },
        };
      })
    );

    res.json({
      listings: enrichedListings,
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

export const getListing = async (req, res) => {
  try {
    const listing = await MarketListing.findById(req.params.id)
      .populate("farmer", "name email phone")
      .populate("linkedPlan.planId");

    if (!listing)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "listing_not_found") });

    // Increment views
    listing.views = (listing.views || 0) + 1;
    await listing.save();

    // Get market data
    const mahsolyPrices = await priceService.fetchMahsolyPrices(listing.crop);

    res.json({
      listing,
      marketData: mahsolyPrices,
      priceComparison: {
        listingPrice: listing.pricePerUnit,
        marketPrice: mahsolyPrices.prices?.[0]?.price || mahsolyPrices.price,
        priceDiff: calculatePriceDiff(listing.pricePerUnit, mahsolyPrices),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateListing = async (req, res) => {
  try {
    const updates = req.body;

    const listing = await MarketListing.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      updates,
      { new: true }
    );

    if (!listing)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "listing_not_found") });

    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const listing = await MarketListing.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      { status: "removed" },
      { new: true }
    );

    if (!listing)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "listing_not_found") });

    res.json({ message: "Listing removed", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const getMyListings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { farmer: req.user._id };
    if (status) query.status = status;

    const listings = await MarketListing.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== PLAN-LINKED LISTINGS ==========

export const createListingFromPlan = async (req, res) => {
  try {
    const { planId, crop, quantity, pricePerUnit, description } = req.body;

    // Get the harvest plan
    const plan = await HarvestPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Get market prices
    const marketPrices = await priceService.fetchMahsolyPrices(crop);
    const suggestedPrice =
      marketPrices.prices?.[0]?.price || marketPrices.price || pricePerUnit;

    const listing = await MarketListing.create({
      farmer: req.user._id,
      crop,
      quantity,
      unit: plan.unit || "kg",
      pricePerUnit: pricePerUnit || suggestedPrice,
      suggestedPrice,
      description,
      category: "crops",
      linkedPlan: {
        planType: "HarvestPlan",
        planId,
      },
      aiAnalysis: {
        marketTrend: determineTrend(crop, marketPrices),
        pricePrediction: suggestedPrice,
        demandScore: calculateDemandScore(crop),
        recommendations: generateListingRecommendations(
          { crop, quantity, pricePerUnit },
          marketPrices
        ),
        lastAnalyzed: new Date(),
      },
    });

    res.status(201).json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== ORDERS ==========

export const createOrder = async (req, res) => {
  try {
    const { listingId, quantity, deliveryMethod, deliveryAddress, notes } =
      req.body;

    const listing = await MarketListing.findById(listingId);
    if (!listing)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "listing_not_found") });

    if (listing.quantity < quantity)
      return res
        .status(400)
        .json({ message: "Insufficient quantity available" });

    const totalPrice = listing.pricePerUnit * quantity;

    const order = await Order.create({
      buyer: req.user._id,
      seller: listing.farmer,
      listing: listingId,
      quantity,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      totalPrice,
      currency: listing.currency || "EGP",
      delivery: {
        method: deliveryMethod || "pickup",
        address: deliveryAddress,
      },
      buyerNotes: notes,
      statusHistory: [
        {
          status: "pending",
          changedAt: new Date(),
          changedBy: req.user._id,
        },
      ],
      linkedPlan: listing.linkedPlan?.planId,
    });

    // Reduce listing quantity
    listing.quantity -= quantity;
    if (listing.quantity === 0) listing.status = "sold";
    await listing.save();

    // Notify seller
    await Notification.create({
      user: listing.farmer,
      type: "market_update",
      title: "New Order Received",
      titleArabic: "طلب جديد",
      message: `You received a new order for ${quantity} ${listing.unit} of ${listing.crop}`,
      messageArabic: `تلقيت طلبًا جديدًا لـ ${quantity} ${listing.unit} من ${listing.crop}`,
      priority: "high",
      data: { orderId: order._id, listingId },
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("listing", "title crop images pricePerUnit")
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only buyer or seller can view
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only seller can update status (except cancel)
    if (
      status !== "cancelled" &&
      order.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Only seller can update status" });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      notes,
    });

    await order.save();

    // Notify other party
    const notifyUser =
      req.user._id.toString() === order.buyer.toString()
        ? order.seller
        : order.buyer;

    await Notification.create({
      user: notifyUser,
      type: "market_update",
      title: "Order Status Updated",
      titleArabic: "تحديث حالة الطلب",
      message: `Order status changed to: ${status}`,
      messageArabic: `تم تغيير حالة الطلب إلى: ${status}`,
      data: { orderId: order._id },
    });

    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const addOrderRating = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "completed")
      return res
        .status(400)
        .json({ message: "Can only rate completed orders" });

    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller)
      return res.status(403).json({ message: "Access denied" });

    if (isBuyer) {
      order.buyerRating = { rating, review, createdAt: new Date() };
    } else {
      order.sellerRating = { rating, review, createdAt: new Date() };
    }

    await order.save();
    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== BIDDING ==========

export const placeBid = async (req, res) => {
  try {
    const { amount, message } = req.body;
    const listing = await MarketListing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (!listing.allowBidding)
      return res
        .status(400)
        .json({ message: "Bidding not allowed on this listing" });

    listing.bids.push({
      bidder: req.user._id,
      amount,
      message,
      status: "pending",
    });

    await listing.save();

    // Notify seller
    await Notification.create({
      user: listing.farmer,
      type: "market_update",
      title: "New Bid Received",
      titleArabic: "عرض جديد",
      message: `New bid of ${amount} received on your listing`,
      messageArabic: `تم استلام عرض جديد بقيمة ${amount}`,
      data: { listingId: listing._id },
    });

    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export const respondToBid = async (req, res) => {
  try {
    const { bidId, status } = req.body; // status: accepted, rejected
    const listing = await MarketListing.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const bid = listing.bids.id(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    bid.status = status;
    await listing.save();

    // Notify bidder
    await Notification.create({
      user: bid.bidder,
      type: "market_update",
      title: `Bid ${status}`,
      titleArabic: status === "accepted" ? "تم قبول العرض" : "تم رفض العرض",
      message: `Your bid of ${bid.amount} was ${status}`,
      messageArabic: `تم ${status === "accepted" ? "قبول" : "رفض"} عرضك بقيمة ${
        bid.amount
      }`,
      data: { listingId: listing._id },
    });

    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== AI ANALYSIS ==========

export const refreshAIAnalysis = async (req, res) => {
  try {
    const listing = await MarketListing.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const marketPrices = await priceService.fetchMahsolyPrices(listing.crop);

    listing.aiAnalysis = {
      marketTrend: determineTrend(listing.crop, marketPrices),
      pricePrediction:
        marketPrices.prices?.[0]?.price ||
        marketPrices.price ||
        listing.pricePerUnit,
      demandScore: calculateDemandScore(listing.crop),
      recommendations: generateListingRecommendations(listing, marketPrices),
      lastAnalyzed: new Date(),
    };

    await listing.save();
    res.json({ listing, aiAnalysis: listing.aiAnalysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// ========== HELPER FUNCTIONS ==========

function determineTrend(crop, marketPrices) {
  // Simple trend logic - can be enhanced with historical data
  if (!marketPrices?.prices) return "stable";
  const priceChange = marketPrices.priceChange || 0;
  if (priceChange > 5) return "rising";
  if (priceChange < -5) return "falling";
  return "stable";
}

function calculateDemandScore(crop) {
  // Simplified demand scoring - can be enhanced with actual demand data
  const highDemandCrops = ["wheat", "rice", "tomatoes", "potatoes", "corn"];
  const mediumDemandCrops = ["onions", "garlic", "beans", "lentils"];

  if (highDemandCrops.some((c) => crop.toLowerCase().includes(c))) return 85;
  if (mediumDemandCrops.some((c) => crop.toLowerCase().includes(c))) return 65;
  return 50;
}

function generateListingRecommendations(listing, marketPrices) {
  const recommendations = [];
  const marketPrice = marketPrices?.prices?.[0]?.price || marketPrices?.price;

  if (marketPrice && listing.pricePerUnit) {
    if (listing.pricePerUnit > marketPrice * 1.2) {
      recommendations.push(
        "Your price is above market average. Consider adjusting for faster sales."
      );
    } else if (listing.pricePerUnit < marketPrice * 0.8) {
      recommendations.push(
        "Your price is below market - you might be able to increase it."
      );
    }
  }

  recommendations.push("Add high-quality photos to increase buyer interest.");
  recommendations.push(
    "Include detailed product description and quality grade."
  );

  return recommendations;
}

function calculatePriceDiff(listingPrice, marketPrices) {
  const marketPrice = marketPrices?.prices?.[0]?.price || marketPrices?.price;
  if (!marketPrice || !listingPrice) return null;

  const diff = ((listingPrice - marketPrice) / marketPrice) * 100;
  return {
    percentage: Math.round(diff * 10) / 10,
    status:
      diff > 10 ? "above_market" : diff < -10 ? "below_market" : "at_market",
  };
}

export default {
  createListing,
  listListings,
  getListing,
  updateListing,
  deleteListing,
  getMyListings,
  createListingFromPlan,
  createOrder,
  getOrder,
  updateOrderStatus,
  addOrderRating,
  placeBid,
  respondToBid,
  refreshAIAnalysis,
};
