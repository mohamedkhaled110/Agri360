import express from "express";
const router = express.Router();

router.get("/test-api", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is working!",
    time: new Date(),
    environment: process.env.NODE_ENV || "development"
  });
});

export default router;
