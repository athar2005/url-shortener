const path = require("path");
require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const shortid = require("shortid");
const QRCode = require("qrcode");
const Url = require("./models/Url");

const app = express();
connectDB();

app.use(express.json());

// ✅ Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Test route
app.get("/", (req, res) => {
  res.send("URL Shortener API Running");
});

// Shorten URL + QR
app.post("/shorten", async (req, res) => {
  try {
    const { longUrl, customCode } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: "Long URL required" });
    }

    const shortCode = customCode || shortid.generate();

    const existing = await Url.findOne({ shortCode });
    if (existing) {
      return res.status(409).json({
        error: "Custom short name already exists"
      });
    }

    // ✅ IMPORTANT FIX
    const shortUrl = `${req.protocol}://${req.get("host")}/${shortCode}`;
    const qrCode = await QRCode.toDataURL(shortUrl);

    const url = new Url({ longUrl, shortCode });
    await url.save();

    res.json({ longUrl, shortUrl, qrCode });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redirect
app.get("/:code", async (req, res) => {
  const url = await Url.findOne({ shortCode: req.params.code });
  if (url) {
    return res.redirect(url.longUrl);
  }
  res.status(404).send("URL not found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
