import marketService from "../services/market.service.js";

export const getPrices = async (req, res) => {
  try {
    const mahsoly = await marketService.fetchMahsolyPrices();
    if (mahsoly && mahsoly.length)
      return res.json({ prices: mahsoly, source: "mahsoly" });
    const fallback = marketService.getFallbackPrices();
    return res.json({ prices: fallback, source: "fallback" });
  } catch (err) {
    console.error("Market controller error", err.message);
    res.status(500).json({ message: "Failed to fetch market prices" });
  }
};

export default { getPrices };
