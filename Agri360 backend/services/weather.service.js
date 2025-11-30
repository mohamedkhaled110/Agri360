import axios from "axios";

// Simple geocoding using Nominatim (OpenStreetMap)
async function geocode(location) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      location
    )}`;
    const r = await axios.get(url, {
      headers: { "User-Agent": "Agri360/1.0" },
    });
    if (r.data && r.data.length) {
      return { lat: parseFloat(r.data[0].lat), lon: parseFloat(r.data[0].lon) };
    }
  } catch (err) {
    console.warn("Geocode error", err.message);
  }
  return null;
}

async function fetchOpenMeteo(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&timezone=auto&forecast_days=3`;
    const r = await axios.get(url);
    return r.data;
  } catch (err) {
    console.warn("OpenMeteo error", err.message);
    return null;
  }
}

export const getCurrent = async ({ location, lat, lon }) => {
  try {
    let coords = null;
    if (lat && lon) coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
    else if (location) coords = await geocode(location);
    if (!coords) throw new Error("Location not found");

    const data = await fetchOpenMeteo(coords.lat, coords.lon);
    if (!data || !data.current_weather) {
      // fallback mock
      return {
        location: location || "Unknown",
        temperature: 28,
        humidity: 45,
        windSpeed: 12,
        condition: "sunny",
        forecast: [],
      };
    }

    return {
      location: location || `${coords.lat},${coords.lon}`,
      temperature: data.current_weather.temperature,
      windSpeed: data.current_weather.windspeed,
      condition: data.current_weather.weathercode || "unknown",
      forecast: [],
      raw: data,
    };
  } catch (err) {
    console.error("weather.service.getCurrent error", err.message);
    return {
      location: location || "Unknown",
      temperature: 28,
      humidity: 45,
      windSpeed: 12,
      condition: "sunny",
      forecast: [],
    };
  }
};

export const getForecast = async ({ location, lat, lon, days = 3 }) => {
  try {
    let coords = null;
    if (lat && lon) coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
    else if (location) coords = await geocode(location);
    if (!coords) throw new Error("Location not found");
    const data = await fetchOpenMeteo(coords.lat, coords.lon);
    return data || {};
  } catch (err) {
    console.error("weather.service.getForecast error", err.message);
    return {};
  }
};

export default { getCurrent, getForecast };
