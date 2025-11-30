// Water planning helpers
export const estimateWaterNeeds = async ({
  crop,
  areaHectares,
  stage = "growth",
}) => {
  // very simplified water need estimator (m3 per hectare)
  const base =
    { wheat: 4500, maize: 6000, rice: 12000 }[crop?.toLowerCase()] || 5000;
  const factor = stage === "germination" ? 0.2 : stage === "harvest" ? 0.1 : 1;
  const m3 = base * factor * (areaHectares || 1);
  return { estimatedM3: m3 };
};

export const analyzeWater = async (water) => {
  if (!water) {
    return {
      status: "unknown",
      message: "No water data available",
      recommendations: ["Add water source information for better analysis"],
    };
  }

  const analysis = {
    status: "good",
    availableM3: water.availableM3 || 0,
    monthlyAvailable: water.availableM3PerMonth || 0,
    source: water.source || "unknown",
    irrigationType: water.irrigationType || "unknown",
    recommendations: [],
    warnings: [],
  };

  // Check water availability
  if (water.availableM3PerMonth < 1000) {
    analysis.status = "critical";
    analysis.warnings.push(
      "Very low water availability - may need alternative sources"
    );
    analysis.recommendations.push(
      "Consider drip irrigation to maximize efficiency"
    );
    analysis.recommendations.push("Look into rainwater harvesting");
  } else if (water.availableM3PerMonth < 3000) {
    analysis.status = "moderate";
    analysis.warnings.push("Limited water availability");
    analysis.recommendations.push("Plan crops with lower water requirements");
  }

  // Irrigation type efficiency
  const irrigationEfficiency = {
    drip: 0.9,
    sprinkler: 0.75,
    furrow: 0.6,
    flood: 0.5,
    center_pivot: 0.85,
  };

  const efficiency = irrigationEfficiency[water.irrigationType] || 0.6;
  analysis.irrigationEfficiency = efficiency;

  if (efficiency < 0.7) {
    analysis.recommendations.push(
      `Consider upgrading to drip irrigation (${Math.round(
        (0.9 - efficiency) * 100
      )}% more efficient)`
    );
  }

  // Water source considerations
  if (water.source === "rain") {
    analysis.warnings.push("Rain-dependent - plan for dry seasons");
    analysis.recommendations.push("Build water storage for dry periods");
  } else if (water.source === "well") {
    analysis.recommendations.push("Monitor groundwater levels regularly");
  }

  return analysis;
};

export default { estimateWaterNeeds, analyzeWater };
