const { Router } = require('express');
const userAuthController = require('../modules/users/user_auth/UserAuth.cont');

const authApiKey = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <apiKey>"

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key is required' });
  }
  const redisClient = req.app.locals.redisClient;

  try {
    const storedEmail = await redisClient.get(`apiKey:${apiKey}`);
    if (!storedEmail) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }
    req.apiKey = apiKey;
    req.email = storedEmail;
    next();
  } catch (error) {
    console.error('Redis Error in authApiKey:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

class Routes {
  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    // Mount all routes here (in future)
    this.router.post('/generate-otp', userAuthController.requestOTP);
    this.router.post('/verify-otp', userAuthController.verifyOTP);
    this.router.post('/user-auth', authApiKey, userAuthController.createUserAuth);

  }

  getRouter() {
    return this.router;
  }
}

module.exports = new Routes().getRouter();
