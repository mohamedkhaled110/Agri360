import axios from "axios";
import ForexRate from "../models/ForexRate.js";

// Primary: CurrencyFreaks API (with key)
export const fetchExchangeRate = async (base = "USD", target = "EGP") => {
  const key = process.env.CURRENCY_API_KEY;
  const apiBase =
    process.env.CURRENCY_API_BASE ||
    "https://api.currencyfreaks.com/v2.0/rates/latest";

  if (!key) {
    console.warn("CURRENCY_API_KEY not set, falling back to free API");
    return fetchExchangeRateFallback(base, target);
  }

  try {
    const url = `${apiBase}?apikey=${key}&base=${base}`;
    const res = await axios.get(url);
    const rate = res.data.rates?.[target] || null;
    if (rate) await ForexRate.create({ base, target, rate });
    return rate;
  } catch (err) {
    console.warn(
      `CurrencyFreaks API error: ${err.message}, falling back to free API`
    );
    return fetchExchangeRateFallback(base, target);
  }
};

// Fallback: Free exchange rate API (no key required)
export const fetchExchangeRateFallback = async (
  base = "USD",
  target = "EGP"
) => {
  const endpoint =
    process.env.EXCHANGE_API || "https://open.er-api.com/v6/latest/USD";
  const url = `${endpoint}?base=${base}`;
  try {
    const res = await axios.get(url);
    const rate = res.data.rates?.[target] || null;
    if (rate) await ForexRate.create({ base, target, rate });
    return rate;
  } catch (err) {
    console.warn(`Forex API error: ${err.message}`);
    return null;
  }
};

export default { fetchExchangeRate, fetchExchangeRateFallback };
