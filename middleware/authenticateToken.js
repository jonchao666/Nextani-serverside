const jwt = require("jsonwebtoken");
const User = require("../models/User");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  // 使用decoded代替user来表示解码后的JWT信息
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.sendStatus(401);
    }

    req.user = user;
    next();
  });
}
module.exports = authenticateToken;
