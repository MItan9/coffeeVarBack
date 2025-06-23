const express = require("express");
const authRoutes = require("./routes/auth");
require("dotenv").config();
const qrRoutes = require("./routes/qrcode");
const passport = require("passport");
const googleAuth = require("./routes/google"); // Инициализация Google OAuth
const session = require("express-session");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/", qrRoutes);

app.use(session({ secret: "coffee_secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(googleAuth);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
