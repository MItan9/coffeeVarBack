const express = require("express");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const { getUserCupsById } = require("../database/dbFunctions");

const router = express.Router();

router.get("/user/cups", authenticateAccessToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const cups = await getUserCupsById(userId);
    res.json({ cups });
  } catch (err) {
    console.error("Ошибка получения чашек:", err);
    res.status(500).json({ error: "Ошибка получения количества чашек" });
  }
});

module.exports = router;
