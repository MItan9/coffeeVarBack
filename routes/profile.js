const express = require("express");
const { findUserById } = require("../database/dbFunctions");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const router = express.Router();

router.get("/user/profile", authenticateAccessToken, async (req, res) => {
  const userId = req.user.id;
  console.log("User ID:", userId);

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Возвращаем только нужные поля
    res.json({
      id: user.id,
      name: user.name,
      surname: user.surname,
      mail: user.mail,
      phone: user.phone,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

module.exports = router;
