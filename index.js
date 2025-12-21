import express from "express";
import axios from "axios";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = 5000;

const gfgLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests. Please wait before refreshing again.",
      retryAfterMinutes: 15,
    });
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("GFG Backend is running");
});

// GFG solved problems route
app.post("/api/gfg/solved", gfgLimiter, async (req, res) => {
  const { handle, year = "", month = "" } = req.body;

  if (!handle) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    const gfgRes = await axios.post(
      "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/",
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

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
