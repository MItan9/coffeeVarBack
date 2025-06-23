const express = require("express");
const authRoutes = require("./routes/auth");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
