import axios from "axios";

export const fetchOilPrice = async () => {
  const key = process.env.OIL_PRICE_API_KEY;
  const apiUrl =
    process.env.OIL_PRICE_API || "https://api.oilpriceapi.com/v1/prices/latest";

  if (!key) {
    console.warn("OIL_PRICE_API_KEY not set; returning mock data");
    return { brent: 90, wti: 85, usd: 1 };
  }

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        Authorization: `Token ${key}`,
      },
    });

    // Extract relevant fields
    return {
      brent: res.data.brent || null,
      wti: res.data.wti || null,
      usd: res.data.usd || 1,
      timestamp: res.data.timestamp || new Date(),
    };
  } catch (err) {
    console.warn(`Oil Price API error: ${err.message}`);
    return { brent: null, wti: null, usd: 1 };
  }
};

export default { fetchOilPrice };
