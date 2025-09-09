const { sendEmail } = require('../../../services/nodemailer');
const UserAuth = require('./UserAuth.model');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

class UserAuthController {
  constructor() {
    this.generateOTP = this.generate_OTP.bind(this);
    this.verifyOTP = this.verify_OTP.bind(this);
    this.createUserAuth = this.createUserAuth.bind(this);
  }

  async generate_OTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const redisClient = req.app.locals.redisClient;

      if (!redisClient.isOpen) await redisClient.connect();
      await redisClient.setEx(`otp:${email}`, 5 * 60, otp);

      const customContent = `<p>Your OTP code is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`;

      await sendEmail({
        to: email,
        subject: 'OTP Code for Registration - Barangay Sta. Monica\'s of Quezon City Portal',
        html: `<div class="content">${customContent}</div>`,
      });

      res.status(201).json({
        message: 'OTP code sent to your email. It will expire in 5 minutes.',
        success: true
      });
    } catch (error) {
      console.error('Error in OTP request:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  async verify_OTP(req, res) {
    try {
      // Validate request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: 'OTP code is required',
          message: 'Please check your provided email.'
        });
      }

      const { email, otp } = req.body;

      // Validate required fields
      if (!email || !otp) {
        return res.status(400).json({
          error: 'Email and OTP are required',
          message: 'Please ensure all fields provided are correct.',
          success: false
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          success: false
        });
      }

      const redisClient = req.app.locals.redisClient;
      if (!redisClient.isOpen) await redisClient.connect();

      const storedOtp = await redisClient.get(`otp:${email}`);
      if (!storedOtp || storedOtp !== otp) {
        return res.status(400).json({
          error: 'Invalid or expired OTP',
          success: false
        });
      }

      // Ensure JWT secret exists
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({
          error: 'Server configuration error',
          success: false
        });
      }

      const jwtToken = jwt.sign(
        {
          email: email,
          purpose: 'registration'
        },
        process.env.JWT_SECRET,
        { expiresIn: '45m' }
      );

      await redisClient.del(`otp:${email}`);

      const customContent = `<p>Your OTP was successfully verified. Please proceed to next process to complete registration.</p>`;

      await sendEmail({
        to: email,
        subject: 'OTP Verification Successful - Barangay Sta. Monica\'s of Quezon City Portal',
        html: `<div class="content">${customContent}</div>`,
      });

      res.status(200).json({
        message: 'OTP code verified and your provided email was saved successfully. Proceed to your registration.',
        token: jwtToken,
        success: true
      });
    } catch (error) {
      console.error('Error in verifying OTP:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false
      });
    }
  }


  // This is intended for registration too (direct system)
  async createUserAuth(req, res) {
    try {
      // Check if email is attached by auth middleware
      if (!req.email) {
        return res.status(401).json({
          error: 'Authentication required. Please provide a valid token.',
          success: false
        });
      }

      const { email } = req;

      // Validate request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: 'Request body is required',
          success: false
        });
      }

      const { username, password } = req.body;

      // Validate required fields with detailed messages
      const missingFields = [];
      if (!username) missingFields.push('username');
      if (!password) missingFields.push('password');

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Missing required fields: ${missingFields.join(', ')}`,
          success: false
        });
      }

      // Additional validation
      if (username.length < 3) {
        return res.status(400).json({
          error: 'Username must be at least 3 characters long',
          success: false
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long',
          success: false
        });
      }

      // Check for existing users
      const existingUserByEmail = await UserAuth.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(409).json({
          error: 'User already exists with this email address',
          success: false
        });
      }

      const existingUserByUsername = await UserAuth.findOne({ where: { username } });
      if (existingUserByUsername) {
        return res.status(409).json({
          error: 'Username is already taken. Please choose a different username.',
          success: false
        });
      }

      const userId = uuidv4();
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      const user = await UserAuth.create({
        user_id: userId,
        username,
        email,
        password: hashedPassword,
        account_type: 'system'
      });

      const customContent = `
    <p>Maligayang Araw, ${username}! Your registration with Sta. Monica's Portal was successful. 
    We're excited to have you join our community. Explore essential features para sa ating online transactions!</p>
  `;

      await sendEmail({
        to: email,
        subject: 'Welcome to Barangay Sta. Monica\'s of Quezon City Portal',
        html: `<div class="content">${customContent}</div>`,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          account_type: user.account_type
        },
        success: true
      });

    } catch (error) {
      console.error('Error in createUserAuth:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false
      });
    }
  }
}

module.exports = new UserAuthController();

// JUST DELETE THIS AWAY.
// I need to build this src/modules/users/user_auth/UserAuth.cont.js (CONTROLLER)
// I need to do POST (To add new data) with my src/services/nodemailer.js
// Use generateEmailTemplate to provide design for OTP and Registration Success.

// Registration Process:
// 1. Issuance of OTP with email_address required field then after POST request
// 2. Once OTP was issued then do 5 minute countdown for expiration once it use then it will provide OTP code success right then after that we need to make sure that OTP should be expired right after so that no one can bother to use that OTP code again for next use before reaching 5 minute countdown.
// 3. I will just need the route for adding new data to be needed to execute some Auth (API Key) generated from successful OTP code to do POST request (add new data) for actual UserAuth.
// 4. That's it


// TODO: login, logout, refresh_token, forgot_pwd, verify_acc, generate_otp
// TODO: Gmail (OAuth)
// TODO: login logic 
// 1. Determine login if system (username, pwd) or gmail (using gmail acc)
// 2. After submitting credentials, send OTP to their email
// 3. Enter OTP if match go to homepage / dashboard.
// 4. If not match try again only 3 tries.
// 5. If 3 tries and didn't match account is lock you may contact admin via this email.
// TODO: Log out logic
// 1. When user clicks logout, the backend must recieve log.
// 2. Frontend - Remove all cookies and local storages stored data.
// 3. Totally log out
// TODO: Refresh Token 
// 1. When user refreshes the page a token will send using access token
// 2. Override, existing refresh token and access token
// TODO: forgot password 
// 1. When user clicks forgot password enter email address
// 2. Check the email address if existing on server
// 3. Once, existing send an OTP to email address
// 4. Type the OTP and if matches reset password.
// 5. If not matches try again and have a didn't recieved code. Resend
// 6. Once clicked Resend a 60 second countdown will show.
// TODO: Verify account
// 1. Verify Email address
// TODO: Generate OTP (per login or 30 days)
// 1. User must recieved an access token 
// 2. Validate access token if legit if yes generate an OTP. 
// 3. If no, return an error
//
// NOTE: Every process add user_logs starting user_auth
