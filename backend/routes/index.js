const express = require("express");
const router = express.Router();

const payments = require("./payments");
const stripeConnect = require("./stripe-connect");

router.use("/api", payments);
router.use("/api/stripe-connect", stripeConnect);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.json({
    message: "KerbDrop Backend API",
    version: "1.0.0",
    endpoints: {
      payments: "/api/*",
      stripeConnect: "/api/stripe-connect/*",
      health: "/health",
    },
  });
});

// Health check endpoint
router.get("/health", function (req, res) {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
