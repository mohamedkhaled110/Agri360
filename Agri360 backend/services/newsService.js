import newsConfig from "../config/news.js";
import axios from "axios";
import { ENV } from "../config/env.js";

export const getNewsSentiment = async (topic) => {
  const res = await newsConfig.fetchNewsSentiment(topic);
  return res;
};

export const deepSeekAnalyze = async (prompt) => {
  try {
    if (!ENV.DEEPSEEK_API_KEY) {
      console.warn("⚠️ DeepSeek API key not found. Returning mock result.");
      return { analysis: "Mock analysis – DeepSeek API key pending." };
    }

    const response = await axios.post(
      "https://api.deepseek.com/v1/analyze",
      { prompt },
      { headers: { Authorization: `Bearer ${ENV.DEEPSEEK_API_KEY}` } }
    );
    return response.data;
  } catch (error) {
    console.error("❌ DeepSeek error:", error.message);
    return { error: "DeepSeek service unavailable." };
  }
};

export default { getNewsSentiment, deepSeekAnalyze };
