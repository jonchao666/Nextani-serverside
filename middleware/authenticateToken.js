const { firebaseAdmin } = require("../firebaseConfig");

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer YOUR_TOKEN_HERE
  if (!token) {
    return res
      .status(401)
      .send({ message: "Access denied. No token provided." });
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error); // Log the error for server monitoring
    res.status(403).send({ message: "Invalid or expired token." });
  }
};

module.exports = authenticateToken;
