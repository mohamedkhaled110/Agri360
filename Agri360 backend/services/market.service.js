import axios from "axios";

const MAHSOLY_BASE = process.env.MAHSOLY_API || null;

export const fetchMahsolyPrices = async () => {
  if (!MAHSOLY_BASE) return null;
  try {
    const r = await axios.get(`${MAHSOLY_BASE}/item/all`);
    return r.data;
  } catch (err) {
    console.warn("Mahsoly fetch error", err.message);
    return null;
  }
};

export const getFallbackPrices = () => {
  return [
    { crop: "wheat", price: 12500, unit: "ton" },
    { crop: "corn", price: 9800, unit: "ton" },
    { crop: "rice", price: 15000, unit: "ton" },
    { crop: "cotton", price: 45000, unit: "ton" },
    { crop: "potatoes", price: 8500, unit: "ton" },
    { crop: "tomatoes", price: 12000, unit: "ton" },
    { crop: "onions", price: 7500, unit: "ton" },
    { crop: "citrus", price: 11000, unit: "ton" },
  ];
};

export default { fetchMahsolyPrices, getFallbackPrices };
