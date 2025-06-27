const express = require("express");
const router = express.Router();
require("dotenv").config();

router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
