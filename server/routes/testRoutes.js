const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/protected", protect, (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user,
  });
});

router.get(
  "/admin",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      message: "Admin route working",
      user: req.user,
    });
  }
);

router.get(
  "/user",
  protect,
  authorize("user"),
  (req, res) => {
    res.json({
      message: "User route working",
      user: req.user,
    });
  }
);

module.exports = router;