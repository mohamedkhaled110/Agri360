import axios from "axios";

// Primary: MarketAux API (with key)
export const fetchNewsSentiment = async (query) => {
  const key = process.env.MARKETAUX_API_KEY;
  const apiUrl =
    process.env.MARKETAUX_API || "https://api.marketaux.com/v1/news/all";
  const filters =
    process.env.MARKETAUX_FILTERS ||
    "commodities,agriculture,crops,markets,forex";

  if (!key) {
    console.warn("MARKETAUX_API_KEY not set; returning mock sentiment");
    return { score: 0, count: 0, articles: [], source: "mock" };
  }

  try {
    const url = `${apiUrl}?api_token=${key}&search_term=${encodeURIComponent(
      query
    )}&filter_domain=${filters}`;
    const res = await axios.get(url);
    const articles = res.data.data || [];

    // Simple sentiment heuristic: count positive/negative words
    const text = articles
      .map((a) => (a.title || "") + " " + (a.description || ""))
      .join(" ");
    const positive = (
      text.match(
        /\b(good|rise|increase|gain|positive|benefit|bullish|strong)\b/gi
      ) || []
    ).length;
    const negative = (
      text.match(
        /\b(loss|drop|decrease|negative|concern|risk|bearish|weak)\b/gi
      ) || []
    ).length;
    const score = positive - negative;

    return { score, count: articles.length, articles, source: "marketaux" };
  } catch (err) {
    console.warn(`MarketAux API error: ${err.message}`);
    return {
      score: 0,
      count: 0,
      articles: [],
      source: "error",
      error: err.message,
    };
  }
};

export default { fetchNewsSentiment };
