import { t } from "../utils/translator.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);
  const lang = req && req.lang ? req.lang : "en";
  const message = err.message || t(lang, "server_error");
  res.status(err.status || 500).json({ message });
};

export default { errorHandler };

// middleware/validateRequest.js
export const validateRequest = (requiredFields = []) => {
  return (req, res, next) => {
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        const lang = req && req.lang ? req.lang : "en";
        const msg = t(lang, "missing_field", { field });
        return res.status(400).json({ success: false, message: msg });
      }
    }
    next();
  };
};
