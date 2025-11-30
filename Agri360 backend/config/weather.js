import axios from "axios";

export const fetchForecast = async (lat, lon) => {
  // Use Open-Meteo public API (no key required; free tier)
  const endpoint =
    process.env.OPEN_METEO_ENDPOINT || "https://api.open-meteo.com/v1/forecast";
  const url = `${endpoint}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=UTC`;
  const res = await axios.get(url);
  return res.data;
};

export const fetchWeatherAPIForecast = async (lat, lon) => {
  // Use WeatherAPI.com (requires API key)
  const key = process.env.WEATHER_API_KEY;
  const baseUrl =
    process.env.WEATHER_API_BASE_URL || "https://api.weatherapi.com/v1";

  if (!key) throw new Error("WEATHER_API_KEY not set");

  const url = `${baseUrl}/current.json?key=${key}&q=${lat},${lon}&aqi=yes`;
  const res = await axios.get(url);

  // Transform WeatherAPI response to match standard forecast format
  const current = res.data.current;
  return {
    current: {
      temperature: current.temp_c,
      weatherCode: current.condition.code,
      windSpeed: current.wind_kph,
      humidity: current.humidity,
      precipitationProbability: current.precip_mm,
    },
    location: {
      name: res.data.location.name,
      country: res.data.location.country,
      lat: res.data.location.lat,
      lon: res.data.location.lon,
    },
  };
};

export default { fetchForecast, fetchWeatherAPIForecast };
