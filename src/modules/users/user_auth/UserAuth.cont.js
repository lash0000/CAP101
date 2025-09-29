const { sendEmail } = require('../../../services/nodemailer');
const emailTemplate = require('../../../services/email.template');
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

      const { html, text, subject } = await emailTemplate.renderAll('generate_otp', {
        otp,
        title: "OTP Code for Registration",
        header: "Barangay Sta. Monica's of Quezon City Portal",
        body: `Your OTP code is: <strong>${otp}</strong>. It will expire in 5 minutes.`,
      });

      await sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      res.status(201).json({
        message: 'OTP code sent to your email. It will expire in 5 minutes.',
        success: true,
      });
    } catch (error) {
      console.error('Error in OTP request:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  }

  async verify_OTP(req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: 'OTP code is required',
          message: 'Please check your provided email.',
        });
      }

      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          error: 'Email and OTP are required',
          message: 'Please ensure all fields provided are correct.',
          success: false,
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          success: false,
        });
      }

      // Note: OTP verification is no longer performed due to Redis removal
      // Consider implementing an alternative storage mechanism for OTPs

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({
          error: 'Server configuration error',
          success: false,
        });
      }

      const jwtToken = jwt.sign(
        {
          email: email,
          purpose: 'registration',
        },
        process.env.JWT_SECRET,
        { expiresIn: '45m' },
      );

      const { html, text, subject } = await emailTemplate.renderAll('verify_otp', {
        title: "OTP Verification Successful",
        header: "Barangay Sta. Monica's of Quezon City Portal",
        body: "Your OTP was successfully verified. Please proceed to the next process to complete registration.",
      });

      await sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      res.status(200).json({
        message: 'OTP code verified and your provided email was saved successfully. Proceed to your registration.',
        token: jwtToken,
        success: true,
      });
    } catch (error) {
      console.error('Error in verifying OTP:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false,
      });
    }
  }

  // This is intended for registration too (direct system)
  async createUserAuth(req, res) {
    try {
      if (!req.email) {
        return res.status(401).json({
          error: 'Authentication required. Please provide a valid token.',
          success: false,
        });
      }

      const { email } = req;

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: 'Request body is required',
          success: false,
        });
      }

      const { username, password } = req.body;

      const missingFields = [];
      if (!username) missingFields.push('username');
      if (!password) missingFields.push('password');

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Missing required fields: ${missingFields.join(', ')}`,
          success: false,
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          error: 'Username must be at least 3 characters long',
          success: false,
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long',
          success: false,
        });
      }

      const existingUserByEmail = await UserAuth.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(409).json({
          error: 'User already exists with this email address',
          success: false,
        });
      }

      const existingUserByUsername = await UserAuth.findOne({ where: { username } });
      if (existingUserByUsername) {
        return res.status(409).json({
          error: 'Username is already taken. Please choose a different username.',
          success: false,
        });
      }

      const userId = uuidv4();
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      const user = await UserAuth.create({
        user_id: userId,
        username,
        email,
        password: hashedPassword,
        account_type: 'system',
      });

      const { html, text, subject } = await emailTemplate.renderAll('welcome', {
        username,
        title: "Welcome to Barangay Sta. Monica's Portal",
        header: "Barangay Sta. Monica's of Quezon City Portal",
        body: `Maligayang Araw, ${username}! Your registration with Sta. Monica's Portal was successful. We're excited to have you join our community. Explore essential features para sa ating online transactions!`,
      });

      await sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      res.status(201).json({
        message: 'New user was registered successfully',
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          account_type: user.account_type,
        },
        success: true,
      });
    } catch (error) {
      console.error('Error in createUserAuth:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false,
      });
    }
  }
}

module.exports = new UserAuthController();
