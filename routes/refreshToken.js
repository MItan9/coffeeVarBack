const express = require("express");
require("dotenv").config();
const { verifyRefreshToken, generateAccessToken } = require("../utils/jwt");
const { findUserByRefreshToken } = require("../database/dbFunctions");

const router = express.Router();

// =============== REFRESH TOKEN ==================
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ error: "No token provided" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await findUserByRefreshToken(refreshToken);

    if (!user || user.id !== payload.id) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

module.exports = router;
