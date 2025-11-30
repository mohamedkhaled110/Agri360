import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String },
    location: {
      lat: Number,
      lon: Number,
      address: String,
      governorate: String,
      city: String,
    },
    soil: {
      ph: Number,
      nitrogen: Number,
      phosphorus: Number,
      potassium: Number,
      organicMatter: Number,
      soilType: {
        type: String,
        enum: ["clay", "sandy", "loamy", "alluvial", "sandy_loam", "clay_loam"],
      },
      lastTestDate: Date,
    },
    water: {
      availableM3: Number,
      availableM3PerMonth: Number,
      source: {
        type: String,
        enum: ["canal", "well", "river", "rain", "mixed"],
      },
      irrigationType: {
        type: String,
        enum: ["flood", "drip", "sprinkler", "furrow", "center_pivot"],
      },
    },
    fieldSizeHectares: Number,

    // Crop History - tracks what was planted before
    cropHistory: [
      {
        crop: String,
        cropArabic: String,
        season: { type: String, enum: ["winter", "summer", "nili"] },
        year: Number,
        plantingDate: Date,
        harvestDate: Date,
        yieldTonnes: Number,
        yieldPerHectare: Number,
        revenue: Number,
        costs: Number,
        profit: Number,
        notes: String,
        planId: { type: mongoose.Schema.Types.ObjectId, ref: "HarvestPlan" },
      },
    ],

    // Animals/Livestock
    animals: [
      {
        type: {
          type: String,
          enum: [
            "cattle",
            "sheep",
            "goats",
            "poultry",
            "ducks",
            "rabbits",
            "fish",
            "bees",
            "camels",
            "buffalo",
          ],
        },
        typeArabic: String,
        count: Number,
        breed: String,
        purpose: {
          type: String,
          enum: ["meat", "dairy", "eggs", "wool", "honey", "mixed"],
        },
        housingType: String,
        feedSource: String,
        lastHealthCheck: Date,
        notes: String,
      },
    ],

    // Infrastructure
    infrastructure: {
      hasStorage: Boolean,
      storageCapacityTonnes: Number,
      hasMachinery: Boolean,
      machineryList: [String],
      hasGreenhouse: Boolean,
      greenhouseAreaM2: Number,
    },

    // Preferences
    preferences: {
      preferredCrops: [String],
      preferredAnimals: [String],
      riskTolerance: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
      focusArea: {
        type: String,
        enum: ["crops", "animals", "mixed"],
        default: "crops",
      },
      organicFarming: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Farm", farmSchema);
