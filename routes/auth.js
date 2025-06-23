const express = require("express");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const { createUser, findUserByMail } = require("../database/userFunctions");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, userSurname, mail, phone, password, role = "user" } = req.body;
  if (!username || !userSurname || !mail || !phone || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = await createUser(username, userSurname, mail, phone, hashedPassword, role);

    const user = { id: userData.id, username, mail, role };
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User already exists or database error" });
  }
});

router.post("/login", async (req, res) => {
  const { mail, password } = req.body;

  try {
    const user = await findUserByMail(mail);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
