// config/env.js
import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  QWEN_API_KEY: process.env.QWEN_API_KEY,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  MARKET_API_KEY: process.env.MARKET_API_KEY,
};
