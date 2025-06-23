const express = require("express");
const QRCode = require("qrcode");
const { createOrUpdateQrCode } = require("../database/dbFunctions");

const router = express.Router();

router.get("/user/:id/qrcode", async (req, res) => {
  const userId = req.params.id;

  try {
    const code = await createOrUpdateQrCode(userId);
    const qrImage = await QRCode.toDataURL(code);

    res.json({ qr: qrImage, expiresIn: "2 minutes" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "QR generation failed" });
  }
});

module.exports = router;
