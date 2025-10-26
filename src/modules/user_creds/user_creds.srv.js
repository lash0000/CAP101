const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sequelize = require('../../../config/db.config');

const mdl_UserCredentials = require('./user_creds.mdl');
const UserSessionsService = require('../user_sessions/user_sessions.srv');

const nodemailer = require('../../utils/nodemailer.utils');
const EmailTemplate = require('../../utils/email_template.utils');

class UserCredsService extends UserSessionsService {
  constructor() {
    // Call the parent class constructor
    super();

    // Initialize the user credentials model
    this.model = mdl_UserCredentials;

    // Bind methods to the class instance
    this.logout = this.logout.bind(this);
    this.login = this.login.bind(this);
    this.refresh = this.refresh.bind(this);
    this.register = this.register.bind(this);
    this.generateOtp = this.generateOtp.bind(this);
    this.verifyOtp = this.verifyOtp.bind(this);
  }

  /*
  * Method: login
  * Description: Handle user login, uses transaction since it involves multiple DB operations
  * Route: POST /api/v1/data/user-creds/login
  * Controller: UserCredsController.as_login
  * Body: { email, password }
  * Response: { message, accessToken, user (user_id, email, acc_type) }, refreshToken on cookies
  * Authorization: No authorization required
  */
  async login(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { email, password } = req.body;

      // Validate inputs
      if (!email || !password) {
        throw new Error('Either username or email is required along with password.');
      }

      // Find user record
      const user = await this.model.findOne({ where: { email: email } }, { transaction });
      if (!user) throw new Error('User not found');

      // Validate password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) throw new Error('Invalid password');

      // Validate user status
      if (!user.is_active) throw new Error('Email not verified. Please verify your email before logging in.');
      if (!user.is_verified) throw new Error('User not active. Please contact the administrator.');

      // Prepare user payload for token generation
      const userPayload = {
        user_id: user.user_id,
        email: user.email,
        acc_type: user.acc_type
      };
      console.log(userPayload);

      // Generate tokens using inherited methods

      const accessToken = super.f_generateAccessToken(userPayload);
      const refreshToken = super.f_generateRefreshToken(userPayload);

      // Create session record
      const user_session = await super.createSession(userPayload.user_id, req, transaction);

      // Commit DB Transaction
      await transaction.commit();

      // Add refresh token to HTTP-only cookie
      // Applicable for AWS API Gateway
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'None',
        maxAge: 15 * 24 * 60 * 60 * 1000,
      });

      // Return success response
      return {
        message: 'Login successful',
        accessToken,
        sessionId: user_session.session_id,
        user: userPayload
      };
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw new Error(`Login failed: ${error.message}`);
    }
  }
  // -- END OF login

  /*
  * Method: logout
  * Description: Handle user logout, uses transaction since it involves multiple DB operations
  * Route: POST /api/v1/data/user-creds/logout
  * Controller: UserCredsController.as_logout
  * Body: { session_id }, refreshToken from cookies
  * Response: { message }
  * Authorization: No authorization required
  */
  async logout(req, res) {
    const transaction = await sequelize.transaction();

    try {
      // Get Session ID
      const { sessionId } = req.body;
      if (!sessionId) throw new Error('Session ID is required for logout.');

      // Get refresh token from cookies
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) throw new Error('No refresh token found.');

      // Delete session record from database
      await this.endSession(sessionId, req, transaction);

      // Commit DB Transaction
      await transaction.commit();

      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      });

      // Return confirmation
      return {
        message: 'Logout successful. Session ended.',
      };
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
  // -- END OF logout

  /*
  * Method: refresh
  * Description: Handle token refresh
  * Route: POST /api/v1/data/user-creds/refresh
  * Controller: UserCredsController.as_refresh
  * Body: N/A, uses refreshToken from cookies
  * Response: { message, accessToken }
  * Authorization: No authorization required
  */
  async refresh(req, res) {
    try {
      // Extract refresh token from cookies
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) throw new Error('No refresh token provided.');

      // Verify refresh token
      const decoded = super.f_verifyRefreshToken(refreshToken);
      if (!decoded || !decoded.user_id) {
        throw new Error('Invalid or expired refresh token.');
      }

      // Ensure user still exists and is active
      const user = await this.model.findOne({
        where: { user_id: decoded.user_id, is_active: true, is_verified: true },
      });
      if (!user) throw new Error('User not found or inactive.');

      // Recreate the payload
      const userPayload = {
        user_id: user.user_id,
        email: user.email,
        acc_type: user.acc_type,
      };

      // Generate new tokens
      const newAccessToken = super.f_generateAccessToken(userPayload);

      // Return the new access token
      return {
        message: 'Token refreshed successfully.',
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }
  // -- END OF refresh

  /*
  * Method: register
  * Description: Handle user registration and an email will be sent after successful registration
  * Route: POST /api/v1/data/user-creds/register
  * Controller: UserCredsController.as_register
  * Body: { email, password, acc_type (optional, default: 'system') }
  * Response: { message }
  * Authorization: No authorization required
  */
  async register({ email, password, acc_type = 'system' }) {
    try {
      if (!email || !password) throw new Error('Email and password are required');
      const hashedPassword = await bcrypt.hash(password, 10);

      // create user
      const newUser = await this.model.create({
        email,
        password: hashedPassword,
        acc_type
      });

      // render HTML email
      const { html: welcomeHtml, subject: welcomeSubject } =
        await EmailTemplate.as_renderAll("welcome_user", {
          user: newUser,
          subject: "Welcome to Barangay Santa Monica Services from Quezon City",
        });

      // send email
      await nodemailer.sendEmail({
        to: email,
        subject: welcomeSubject,
        html: welcomeHtml,
      });

      // Return confirmation
      return {
        message: "User registered. Kindly verify your email to access other services."
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
  // -- END OF register

  /*
  * Method: generateOtp
  * Description: Generate OTP for email verification
  * Route: POST /api/v1/data/user-creds/generate-otp
  * Controller: UserCredsController.as_generateOtp
  * Body: { email }
  * Response: { message, token }
  * Authorization: No authorization required
  */
  async generateOtp(email) {
    try {
      if (!email) throw new Error('Email is required');

      // Confirm valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) throw new Error('Invalid email format');

      // Fetch the user to ensure they exist and include in the email
      const existing_user = await this.model.findOne({ where: { email } });
      if (!existing_user) throw new Error('User not found');

      // Generate a 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();

      // Render OTP email template
      const { html: otpHtml, subject: otpSubject } =
        await EmailTemplate.as_renderAll("generate_otp", {
          user: existing_user,
          subject: "Verify your Email for Barangay Santa Monica Services",
          otp
        });

      // Send the OTP email
      await nodemailer.sendEmail({
        to: email,
        subject: otpSubject,
        html: otpHtml,
      });

      // Generate a short-lived token containing the OTP
      const token = super.f_generateAccessToken({ email, otp }, '5m');

      // Return confirmation and token
      return { message: 'New OTP generated and sent to your email. Use the token for verification.', token };
    } catch (error) {
      throw new Error(`OTP generation failed: ${error.message}`);
    }
  }
  // -- END OF generateOtp

  /*
  * Method: verifyOtp
  * Description: Verify OTP for email verification
  * Route: POST /api/v1/data/user-creds/verify
  * Controller: UserCredsController.as_verifyOtp
  * Body: { email, otp }
  * Response: { message }
  * Authorization: No authorization required
  */
  async verifyOtp(email, otp, tokenPayload) {
    try {
      if (!email || !otp) throw new Error('Email and OTP are required');

      // Confirm valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) throw new Error('Invalid email format');

      // Validate token payload
      if (!tokenPayload) throw new Error('Missing token payload');
      if (tokenPayload.email !== email) throw new Error('Invalid token for this email');

      // Compare provided OTP with token payload
      if (String(tokenPayload.otp) !== String(otp)) {
        throw new Error('OTP does not match');
      }

      // Fetch the user
      const verify_user = await this.model.findOne({ where: { email } });
      if (!verify_user) throw new Error('User not found');
      if (verify_user.verified) return { message: 'Email already verified', verify_user };

      // Update user as verified
      await verify_user.update({ is_verified: true });

      // Send verification success email
      const { html: verifyHtml, subject: verifySubject } =
        await EmailTemplate.as_renderAll("verified_user", {
          user: verify_user,
          subject: "Congratulations! Ka-barangay, you are now verified!",
        });

      // Send the verification email
      await nodemailer.sendEmail({
        to: email,
        subject: verifySubject,
        html: verifyHtml,
      });

      // Return confirmation
      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new Error(`OTP verification failed: ${error.message}`);
    }
  }
  // -- END OF verifyOtp

  /*
  * Method: deleteUser
  * Description: Delete a user by email
  * Route: DELETE /api/v1/data/user-creds/delete-user
  * Controller: UserCredsController.as_deleteUser
  * Body: { email }
  * Response: { message }
  * Authorization: Requires access token in headers
  * Note: Only for testing purposes, should be removed in production
  */
  async deleteUser(email) {
    try {
      // Validate input
      if (!email) throw new Error('Email is required');

      // Find the user
      const user = await this.model.findOne({ where: { email } });
      if (!user) throw new Error('User not found');

      // Delete the user
      await user.destroy();

      // Return confirmation
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`User deletion failed: ${error.message}`);
    }
  }
  // -- END OF deleteUser
}

module.exports = new UserCredsService();
