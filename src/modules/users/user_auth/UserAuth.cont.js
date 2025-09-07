const { sendEmail } = require('../../../services/nodemailer');
const UserAuth = require('./UserAuth.model');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class UserAuthController {
  constructor() {
    this.requestOTP = this.requestOTP.bind(this);
    this.verifyOTP = this.verifyOTP.bind(this);
    this.createUserAuth = this.createUserAuth.bind(this);
  }

  async requestOTP(req, res) {
    try {
      /* Debugging issues with buffer :/
      console.log('=== DEBUG: requestOTP called ===');
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));
      console.log('Raw request body:', req.body);
      console.log('Type of req.body:', typeof req.body);
     */
      let body;
      if (Buffer.isBuffer(req.body)) {
        console.log('Body is a Buffer, converting to string...');
        try {
          const bodyString = req.body.toString('utf8');
          console.log('Body as string:', bodyString);
          body = JSON.parse(bodyString);
          console.log('Parsed body from Buffer:', body);
        } catch (parseError) {
          console.log('Failed to parse Buffer body:', parseError);
          return res.status(400).json({ error: 'Invalid JSON format' });
        }
      } else if (typeof req.body === 'string') {
        try {
          body = JSON.parse(req.body);
          console.log('Parsed string body:', body);
        } catch (parseError) {
          console.log('Failed to parse string body:', parseError);
          return res.status(400).json({ error: 'Invalid JSON format' });
        }
      } else if (req.body && typeof req.body === 'object') {
        body = req.body;
        console.log('Object body:', body);
      } else {
        console.log('Unknown body type');
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { email } = body;

      if (!email) {
        console.log('Email is missing from body');
        console.log('Full body received:', body);
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Invalid email format:', email);
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const redisClient = req.app.locals.redisClient;

      if (!redisClient.isOpen) await redisClient.connect();
      await redisClient.setEx(`otp:${email}`, 5 * 60, otp);

      const customContent = `<p>Your OTP code is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`;

      await sendEmail({
        to: email,
        subject: 'OTP for Registration - Barangay Sta. Monica\'s of Quezon City Portal',
        html: `<div class="content">${customContent}</div>`,
      });

      console.log('OTP sent to:', email);
      res.status(200).json({
        message: 'OTP sent to your email. It will expire in 5 minutes.',
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

  async verifyOTP(req, res) {
    try {
      let body;
      if (Buffer.isBuffer(req.body)) {
        try {
          const bodyString = req.body.toString('utf8');

          // Check if the string is valid JSON
          body = JSON.parse(bodyString);
          console.log('Parsed body:', body);
        } catch (parseError) {
          console.log('Failed to parse Buffer body:', parseError.message);
          console.log('Error stack:', parseError.stack);
          return res.status(400).json({ error: 'Invalid JSON format', details: parseError.message });
        }
      } else if (typeof req.body === 'string') {
        try {
          console.log('Body is string:', req.body);
          body = JSON.parse(req.body);
          console.log('Parsed string body:', body);
        } catch (parseError) {
          console.log('Failed to parse string body:', parseError.message);
          return res.status(400).json({ error: 'Invalid JSON format', details: parseError.message });
        }
      } else if (req.body && typeof req.body === 'object') {
        body = req.body;
        console.log('Object body:', body);
      } else {
        console.log('Unknown body type:', typeof req.body);
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { email, otp } = body;

      if (!email || !otp) {
        return res.status(400).json({ error: 'There is missing field meaning Email and OTP are required' });
      }

      const redisClient = req.app.locals.redisClient;

      // Ensure Redis client is connected
      if (!redisClient.isOpen) {
        console.log('Connecting to Redis...');
        await redisClient.connect();
      }

      const storedOtp = await redisClient.get(`otp:${email}`);
      if (!storedOtp || storedOtp !== otp) {
        console.log('OTP mismatch or expired');
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Generate API key upon successful OTP
      const apiKey = crypto.randomBytes(32).toString('hex');
      console.log('Generated API key:', apiKey);

      // Store API key in Redis with 45-minute expiration
      await redisClient.setEx(`apiKey:${apiKey}`, 45 * 60, email);

      // Delete OTP after successful use
      await redisClient.del(`otp:${email}`);
      console.log('OTP deleted from Redis');
      const customContent = `<p>Your OTP was successfully verified. Please proceed to next process to complete registration.</p>`;

      await sendEmail({
        to: email,
        subject: 'OTP Verification Successful - Barangay Sta. Monica\'s of Quezon City Portal',
        html: `<div class="content">${customContent}</div>`,
      });

      res.status(200).json({
        message: 'OTP verified successfully',
        apiKey,
        success: true
      });
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  async createUserAuth(req, res) {
    try {
      console.log('=== DEBUG: createUserAuth called ===');
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));
      console.log('Request body:', req.body);
      console.log('Is Buffer:', Buffer.isBuffer(req.body));

      const authHeader = req.headers['authorization'];
      const apiKey = authHeader && authHeader.split(' ')[1];
      console.log('API Key from header:', apiKey);

      if (!apiKey) {
        console.log('API Key is missing from header');
        return res.status(401).json({ error: 'API Key is required' });
      }

      let body;
      if (Buffer.isBuffer(req.body)) {
        try {
          const bodyString = req.body.toString('utf8');
          console.log('Body as string:', bodyString);
          body = JSON.parse(bodyString);
          console.log('Parsed body:', body);
        } catch (parseError) {
          console.log('Failed to parse Buffer body:', parseError.message);
          return res.status(400).json({ error: 'Invalid JSON format', details: parseError.message });
        }
      } else if (typeof req.body === 'string') {
        try {
          console.log('Body is string:', req.body);
          body = JSON.parse(req.body);
          console.log('Parsed string body:', body);
        } catch (parseError) {
          console.log('Failed to parse string body:', parseError.message);
          return res.status(400).json({ error: 'Invalid JSON format', details: parseError.message });
        }
      } else if (req.body && typeof req.body === 'object') {
        body = req.body;
        console.log('Object body:', body);
      } else {
        console.log('Unknown body type:', typeof req.body);
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { username, password } = body;
      console.log('Extracted username:', username);
      console.log('Extracted password:', password ? '***' : 'undefined');

      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required',
          received: { username: !!username, password: !!password }
        });
      }

      const redisClient = req.app.locals.redisClient;

      // Ensure Redis client is connected
      if (!redisClient.isOpen) {
        console.log('Connecting to Redis...');
        await redisClient.connect();
      }

      console.log('Checking API key in Redis:', apiKey);
      const email = await redisClient.get(`apiKey:${apiKey}`);
      console.log('Email from Redis:', email);

      if (!email) {
        console.log('Invalid or expired API Key');
        return res.status(401).json({ error: 'Invalid or expired API Key' });
      }

      console.log('Checking if user already exists with email:', email);
      const existingUser = await UserAuth.findOne({ where: { email } });
      if (existingUser) {
        console.log('User already exists:', existingUser.username);
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      // Generate UUID for user_id
      const userId = uuidv4();
      console.log('Generated user_id:', userId);

      // Hash password
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      console.log('Password hashed successfully');

      console.log('Creating user in database...');
      const user = await UserAuth.create({
        user_id: userId, // Use the generated UUID here
        username,
        email,
        password: hashedPassword,
        account_type: 'system'
      });

      console.log('User created successfully:', user.username);

      // Delete API key after successful registration
      await redisClient.del(`apiKey:${apiKey}`);
      console.log('API key deleted from Redis');

      // Send welcoming email for new user
      const customContent = `
      <p>Maligayang Araw, ${username}! Your registration with Sta. Monica's Portal was successful. 
      We're excited to have you join our community. Explore essential features para sa ating online transactions!</p>
    `;

      await sendEmail({
        to: email,
        subject: 'Welcome to Sta. Monica\'s of Quezon City Portal',
        html: `<div class="content">${customContent}</div>`,
      });

      console.log('Welcome email sent to:', email);

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
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message
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
// TODO: Generate OTP
// 1. User must recieved an access token 
// 2. Validate access token if legit if yes generate an OTP. 
// 3. If no, return an error
//
// NOTE: Every process add user_logs starting user_auth
