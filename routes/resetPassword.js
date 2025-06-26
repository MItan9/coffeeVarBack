const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const {
  findUserByMail,
  insertResetToken,
  updatePassword,
  findUserByToken,
} = require("../database/dbFunctions");
const { sendResetPasswordEmail } = require("../utils/mailer");

router.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByMail(email);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const resetToken = uuidv4();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const resetPasswordTokens = await insertResetToken(
      resetToken,
      email,
      expiresAt
    );
    if (!resetPasswordTokens) {
      return res.status(500).json({ error: "Ошибка при сохранении токена" });
    }

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    await sendResetPasswordEmail(email, resetLink);

    res.status(200).json({ message: "Письмо отправлено" });
  } catch (err) {
    console.error("Ошибка при отправке:", err);
    res.status(500).json({ error: "Ошибка при отправке письма" });
  }
});

router.post("/set-new-password", async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await findUserByToken(token);
    if (!user || !user.reset_token || user.token_expires_at < new Date()) {
      return res.status(400).json({ error: "Неверный или истекший токен" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await updatePassword(hashedPassword, user.mail);

    res.status(200).json({ message: "Пароль успешно обновлен" });
  } catch (err) {
    console.error("Ошибка при обновлении пароля:", err);
    res.status(500).json({ error: "Ошибка при обновлении пароля" });
  }
});

module.exports = router;
