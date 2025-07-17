const express = require("express");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const {
  getUserCupsById,
  resetUserCups
} = require("../database/dbFunctions");

const { getUserCupsById, resetUserCups } = require("../database/dbFunctions");


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

// router.post("/user/reset-cups", authenticateAccessToken, async (req, res) => {
//   const userId = req.user.id;

//   try {
//     await resetUserCups(userId);
//     res.status(200).json({ success: true, message: "Чашки успешно сброшены" });
//   } catch (err) {
//     console.error("Ошибка сброса чашек:", err);
//     res.status(500).json({ success: false, message: "Ошибка сброса чашек" });
//   }
// });

module.exports = router;
