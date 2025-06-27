const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
} = require("../utils/jwt");
const {
  createUser,
  findUserByMail,
  saveRefreshToken,
  findUserByRefreshToken,
} = require("../database/dbFunctions");

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

    const user = {
      id: userData.id,
      username: userData.name,
      role: userData.role,
    };

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User already exists or database error" });
  }
});

// =============== LOCAL LOGIN ==================
router.post("/login", async (req, res) => {
  const { mail, password } = req.body;

  try {
    const userInfo = await findUserByMail(mail);
    if (!userInfo)
      return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, userInfo.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const user = {
      id: userInfo.id,
      username: userInfo.name,
      role: userInfo.role,
    };

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      })
      .json({ accessToken, user });
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
          const newUser = await createUser(
            profile.name.givenName || "GoogleUser",
            profile.name.familyName || "",
            email,
            "",
            null,
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
  async (req, res) => {
    const user = {
      id: req.user.id,
      username: req.user.name,
      role: req.user.role,
    };

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        // secure: true, // включить в продакшене (HTTPS)
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      })
      .redirect(
        `http://localhost:5173/google-success?accessToken=${accessToken}`
      );
  }
);

module.exports = router;
