const express = require("express");
const QRCode = require("qrcode");
const { createOrUpdateQrCode } = require("../database/dbFunctions");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

router.get("/user/qrcode", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const generate6DigitCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    const code = generate6DigitCode();
    console.log("Generated code:", code);
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты

    const qrImage = await QRCode.toDataURL(code);

    await createOrUpdateQrCode(userId, code, qrImage, expiresAt);

    res.json({ qr: qrImage, code: code, expiresIn: "2 min" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "QR generation failed" });
  }
});

module.exports = router;
