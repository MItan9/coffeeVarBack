const express = require("express");
const authRoutes = require("./routes/auth");
const resetPassword = require("./routes/resetPassword");
const refreshToken = require("./routes/refreshToken");
const logout = require("./routes/logout");
const profileRoutes = require("./routes/profile");
const cupsRoutes = require("./routes/cups");
require("dotenv").config();
const qrRoutes = require("./routes/qrcode");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const PORT = process.env.PORT || 3000;

// app.use(cors());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(authRoutes);
app.use(resetPassword);
app.use(refreshToken);
app.use(logout);
app.use("/", qrRoutes);
app.use(profileRoutes);
app.use(cupsRoutes);

app.use(
  session({ secret: "coffee_secret", resave: false, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
