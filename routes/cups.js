const express = require("express");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const {
  getUserCupsById,
  resetUserCups
} = require("../database/dbFunctions");

const { getUserCupsById, resetUserCups } = require("../database/dbFunctions");
const { processCupsReward } = require("../database/dbFunctions");


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

router.post("/user/process-cups", authenticateAccessToken, async (req, res) => {
  const { addedCups } = req.body;
  const userId = req.user.id;

  try {
    const result = await processCupsReward(userId, addedCups);
    res.json(result);
  } catch (err) {
    console.error("Ошибка награды чашек:", err);
    res.status(500).json({ error: "Ошибка при обработке чашек" });
  }
});


module.exports = router;
