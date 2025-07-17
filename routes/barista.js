const express = require("express");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");
const {
  getUserByCode,
  updateCupsNumber,
  getUserIdByCode,
  updateCouponsNumber,
} = require("../database/dbFunctions");

const router = express.Router();

router.post("/find-client", authenticateAccessToken, async (req, res) => {
  const code = req.body.code;
  try {
    const client = await getUserByCode(code);
    console.log("Клиент:", client);
    res.json({ client });
  } catch (err) {
    console.error("Ошибка получения клиента:", err);
    res.status(500).json({ error: "Ошибка получения клиента" });
  }
});

router.post(
  "/barista/apply-changes",
  authenticateAccessToken,
  async (req, res) => {
    const code = req.body.code;
    const cupsDelta = req.body.cupsDelta;
    const couponsDelta = req.body.couponsDelta;
    try {
      const client = await getUserIdByCode(code);

      const updateCups = await updateCupsNumber(client.id, cupsDelta);
      const updateCoupons = await updateCouponsNumber(client.id, couponsDelta);

      res.json({
        statusCups: updateCups.success,
        statusCoupons: updateCoupons.success,
      });
    } catch (err) {
      console.error("Ошибка получения клиента:", err);
      res.status(500).json({ error: "Ошибка получения клиента" });
    }
  }
);

module.exports = router;
