export const permit = (...allowed) => {
  return (req, res, next) => {
    const { user } = req;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowed.includes(user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
};

export default { permit };
// middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
  });
};
