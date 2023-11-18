function verifyApiKey(req, res, next) {
  const apiKey = req.header("X-API-Key");

  if (apiKey === process.env.API_KEY) {
    next();
  } else {
    res.status(401).send("Invalid API Key");
  }
}
module.exports = verifyApiKey;
