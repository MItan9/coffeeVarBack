const { verifyAccessToken } = require("../utils/jwt");

function authenticateAccessToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = authenticateAccessToken;
