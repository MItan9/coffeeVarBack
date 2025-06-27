const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Берём после Bearer

  if (!token) {
    return res.status(401).json({ error: "Токен не предоставлен" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Недействительный токен" });

    req.user = user; // Теперь в маршрутах доступен req.user
    next();
  });
}

module.exports = authenticateToken;
