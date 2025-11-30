// Basic soil analysis helper functions. In real systems this would call lab APIs.
export const analyzeSoil = async (soil) => {
  // soil: {ph, nitrogen, phosphorus, potassium, organicMatter}
  const recommendations = {};
  if (soil.ph && soil.ph < 6.0) recommendations.lime = "Apply agricultural lime to raise pH";
  if (soil.nitrogen && soil.nitrogen < 10) recommendations.nitrogen = "Apply nitrogen fertilizer (e.g., urea)";
  if (soil.phosphorus && soil.phosphorus < 10) recommendations.phosphorus = "Apply phosphorus fertilizer";
  if (soil.potassium && soil.potassium < 50) recommendations.potassium = "Apply potassium fertilizer";
  if (soil.organicMatter && soil.organicMatter < 3) recommendations.organic = "Incorporate compost or manure";
  return { recommendations, summary: recommendations };
};

export default { analyzeSoil };
