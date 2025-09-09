const { Router } = require('express');
const userAuthController = require('../modules/users/user_auth/UserAuth.cont');
const EmailDebugController = require('../modules/email_debug/email_post');
const jwt = require('jsonwebtoken');

// Auth method for API protected route per POST / PUT requests that will expire easily.
const authJWT = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <jwtToken>"

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Additional validation for registration purpose
    if (decoded.purpose !== 'registration') {
      return res.status(401).json({ error: 'Invalid token purpose' });
    }

    // Attach user data to request
    req.email = decoded.email;
    req.tokenData = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized - Invalid or already expired token.' });
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
    // Mount all routes here (in future)
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
