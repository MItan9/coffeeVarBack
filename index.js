const express = require("express");
const authRoutes = require("./routes/auth");
require("dotenv").config();
const qrRoutes = require("./routes/qrcode");
const passport = require("passport");
const session = require("express-session");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(authRoutes);
app.use("/", qrRoutes);

app.use(session({ secret: "coffee_secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
