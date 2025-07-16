const express = require("express");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");
const { getUserCoupons, addCouponToUser } = require("../database/dbFunctions");

const router = express.Router();

router.get("/user/coupons", authenticateAccessToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const coupons = await getUserCoupons(userId);
    res.json({ coupons });
  } catch (err) {
    console.error("Ошибка получения купонов:", err);
    res.status(500).json({ error: "Ошибка получения купонов" });
  }
});

router.post("/user/add-coupon", authenticateAccessToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const addCoupon = await addCouponToUser(userId);
    res.json({ addCoupon });
  } catch (err) {
    console.error("Ошибка добавления купона:", err);
    res.status(500).json({ error: "Ошибка добавления купона:" });
  }
});

module.exports = router;
