import express from "express";
import marketController from "../controllers/market.controller.js";

const router = express.Router();

router.get("/prices", marketController.getPrices);

export default router;
