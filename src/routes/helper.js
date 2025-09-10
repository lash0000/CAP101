const { Router } = require('express');
const userAuthController = require('../modules/users/user_auth/UserAuth.cont');
const EmailDebugController = require('../modules/email_debug/email_post');
const jwt = require('jsonwebtoken');

const authJWT = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <jwtToken>"

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // JWT: Verify toke and purpose
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'registration') {
      return res.status(401).json({ error: 'Invalid token purpose' });
    }

    // JWT: Check if token is still valid in Redis
    const redisClient = req.app.locals.redisClient;
    if (!redisClient.isOpen) await redisClient.connect();

    const storedEmail = await redisClient.get(`registration_token:${token}`);
    if (!storedEmail || storedEmail !== decoded.email) {
      return res.status(401).json({ error: 'Token already used or invalid' });
    }

    req.email = decoded.email;
    req.tokenData = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

class Routes {
  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/generate-otp', userAuthController.generateOTP);
    this.router.post('/verify-otp', userAuthController.verify_OTP);
    this.router.post('/user-auth', authJWT, userAuthController.createUserAuth);
    this.router.post('/test-email', EmailDebugController.testEmail);
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new Routes().getRouter();
