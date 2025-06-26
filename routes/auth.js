const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const { generateToken } = require("../utils/jwt");
const { createUser, findUserByMail } = require("../database/dbFunctions");

const router = express.Router();

// =============== LOCAL REGISTER ==================
router.post("/register", async (req, res) => {
  const {
    username,
    userSurname,
    mail,
    phone,
    password,
    role = "user",
  } = req.body;
  // if (!username || !userSurname || !mail || !phone || !password) {
  //   return res.status(400).json({ error: "All fields required" });
  // }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = await createUser(
      username,
      userSurname,
      mail,
      phone,
      hashedPassword,
      role
    );

    const user = { id: userData.id, username, mail, role };
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User already exists or database error" });
  }
});

// =============== LOCAL LOGIN ==================
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

// =============== GOOGLE STRATEGY ==================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await findUserByMail(email);

        if (!user) {
          // Регистрируем нового пользователя
          const newUser = await createUser(
            profile.name.givenName || "GoogleUser",
            profile.name.familyName || "",
            email,
            "", // телефон можно добавить позже
            null, // нет пароля
            "user"
          );
          user = newUser;
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// =============== GOOGLE AUTH ROUTES ==================
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const user = req.user;
    const token = generateToken({
      id: user.id,
      username: user.username,
      mail: user.mail,
      role: user.role,
    });

    // Редиректим на фронт с токеном
    res.redirect(`http://localhost:5173/google-success?token=${token}`);
  }
);

module.exports = router;
