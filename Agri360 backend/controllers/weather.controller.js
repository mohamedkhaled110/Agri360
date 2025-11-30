import weatherService from "../services/weather.service.js";

export const getCurrentWeather = async (req, res) => {
  try {
    const { location, lat, lon } = req.query;
    const data = await weatherService.getCurrent({ location, lat, lon });
    res.json(data);
  } catch (err) {
    console.error("Weather controller error:", err.message);
    res.status(500).json({ message: "Failed to fetch weather" });
  }
};

export const getForecast = async (req, res) => {
  try {
    const { location, days, lat, lon } = req.query;
    const data = await weatherService.getForecast({ location, days, lat, lon });
    res.json(data);
  } catch (err) {
    console.error("Weather forecast error:", err.message);
    res.status(500).json({ message: "Failed to fetch forecast" });
  }
};

export default { getCurrentWeather, getForecast };
