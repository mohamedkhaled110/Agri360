import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { t } from "../utils/translator.js";

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role, country, governorate, lang } =
      req.body;

    if (!name || !email || !password) {
      const msg = t(req.lang || "en", "name_email_password_required");
      return res.status(400).json({ message: msg });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(409)
        .json({ message: t(req.lang || "en", "email_already_registered") });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Normalize language code (convert en-US to en, ar-SA to ar, etc.)
    let normalizedLang = lang || req.lang || "en";
    if (typeof normalizedLang === "string") {
      normalizedLang = normalizedLang.split("-")[0].toLowerCase();
    }
    if (!["en", "ar"].includes(normalizedLang)) {
      normalizedLang = "en";
    }

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "farmer",
      country,
      governorate,
      lang: normalizedLang,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, lang: user.lang },
      process.env.JWT_SECRET || "devsecret"
    );

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: t(req.lang || "en", "email_password_required") });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ message: t(req.lang || "en", "invalid_credentials") });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ message: t(req.lang || "en", "invalid_credentials") });

    // Normalize language for token
    let userLang = user.lang || "en";
    if (typeof userLang === "string") {
      userLang = userLang.split("-")[0].toLowerCase();
    }
    if (!["en", "ar"].includes(userLang)) {
      userLang = "en";
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, lang: userLang },
      process.env.JWT_SECRET || "devsecret"
    );

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

// Simple profile endpoint
export const me = async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ message: t(req.lang || "en", "unauthorized") });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: t(req.lang || "en", "server_error") });
  }
};

export default { register, login, me };
