import { fetchForecast, fetchWeatherAPIForecast } from "../config/weather.js";

export const getForecastForFarm = async (farm) => {
  const { location } = farm || {};
  if (!location || !location.lat || !location.lon) {
    console.warn("Farm location not provided, skipping weather forecast");
    return null;
  }

  // Try WeatherAPI first (if key is provided), fallback to Open-Meteo
  try {
    const data = await fetchWeatherAPIForecast(location.lat, location.lon);
    return data;
  } catch (err) {
    console.warn("WeatherAPI error, falling back to Open-Meteo:", err.message);
    try {
      const data = await fetchForecast(location.lat, location.lon);
      return data;
    } catch (err2) {
      console.warn("Open-Meteo error:", err2.message);
      return null;
    }
  }
};

export default { getForecastForFarm };
