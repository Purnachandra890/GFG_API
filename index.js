import express from "express";
import axios from "axios";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const gfgLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests. Please wait before refreshing again.",
      retryAfterMinutes: process.env.RATE_LIMIT_WINDOW,
    });
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GFG Backend is running");
});

app.post("/api/gfg/solved", gfgLimiter, async (req, res) => {
  const { handle, year = "", month = "" } = req.body;

  if (!handle) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    const gfgRes = await axios.post(
      process.env.GFG_API_URL,
      {
        handle,
        year,
        month,
        requestType: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = gfgRes.data?.result || {};
    const slugs = new Set();

    Object.values(result).forEach((level) => {
      Object.values(level).forEach((p) => {
        if (p.slug) slugs.add(p.slug.toLowerCase());
      });
    });

    res.json({
      success: true,
      slugs: Array.from(slugs),
    });
  } catch (err) {
    if (err.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "GFG rate limit reached. Try again later.",
      });
    }

    console.error("GFG API error:", err.message);
    res.status(500).json({
      success: false,
      error: "GFG fetch failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
