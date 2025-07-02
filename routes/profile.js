const express = require("express");
const {
  updateUserFields,
  findUserById,
  deleteUserById,
} = require("../database/dbFunctions");
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

router.patch("/user/update", authenticateAccessToken, async (req, res) => {
  const userId = req.user.id;
  const { name, surname, phone } = req.body;

  try {
    // обновляем только те поля, которые были переданы
    const updatedField = {};
    if (name !== undefined) updatedField.name = name;
    if (surname !== undefined) updatedField.surname = surname;
    if (phone !== undefined) updatedField.phone = phone;
    console.log("Updated fields:", updatedField);

    await updateUserFields(userId, updatedField);

    const updatedUser = await findUserById(userId);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found after update" });
    }

    res.status(200).json({
      name: updatedUser.name,
      surname: updatedUser.surname,
      mail: updatedUser.mail,
      phone: updatedUser.phone,
    });
    // res.status(200).json({ message: "User profile updated successfully with" });
  } catch (err) {
    console.error("Ошибка при обновлении пользователя:", err);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

router.delete("/user/delete", authenticateAccessToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await deleteUserById(userId);
    res.clearCookie("refreshToken"); // если используешь куки
    res.status(200).json({ message: "Аккаунт успешно удалён" });
  } catch (err) {
    console.error("Ошибка при удалении аккаунта:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
