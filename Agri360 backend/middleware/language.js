// middleware/language.js
// Simple language detection middleware
export const detectLanguage = (req, res, next) => {
  try {
    // priority: query param ?lang=ar, header 'accept-language', user profile (if set on req.user.lang)
    const q = req.query && req.query.lang;
    if (q) {
      req.lang = q;
      return next();
    }

    if (req.user && req.user.lang) {
      req.lang = req.user.lang;
      return next();
    }

    const header = req.headers["accept-language"];
    if (header) {
      // take primary value
      req.lang = header.split(",")[0].trim();
    } else {
      req.lang = "en";
    }
    return next();
  } catch (err) {
    req.lang = "en";
    return next();
  }
};

export default detectLanguage;
