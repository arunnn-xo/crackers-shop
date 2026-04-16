const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'crackers_frontend_secret_key_2026';

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ success: false, message: 'Invalid or missing API Key for public routes.' });
  }

  next();
};

module.exports = apiKeyAuth;
