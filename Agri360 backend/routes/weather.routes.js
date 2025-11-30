import express from "express";
import weatherController from "../controllers/weather.controller.js";

const router = express.Router();

router.get("/current", weatherController.getCurrentWeather);
router.get("/forecast", weatherController.getForecast);

export default router;
