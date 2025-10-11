const UserCredsService = require('./user_creds.srv');

class UserCredsController {
  constructor() {
    // Initialize the service
    this.service = UserCredsService;

    // Bind methods to the class instance
    this.as_login = this.as_login.bind(this);
    this.as_refresh = this.as_refresh.bind(this);
    this.as_logout = this.as_logout.bind(this);
    this.as_register = this.as_register.bind(this);
    this.as_generateOtp = this.as_generateOtp.bind(this);
    this.as_verifyOtp = this.as_verifyOtp.bind(this);
    this.as_deleteUser = this.as_deleteUser.bind(this);
  }

  /*
  * Method: as_login
  * Description: Handle user login
  * Route: POST /api/v1/data/user-creds/login
  * Params: N/A
  * Body: { email, password }
  * Response: { message, accessToken, user (user_id, email, acc_type) }, refreshToken on cookies
  * Authorization: No authorization required
  */
  async as_login(req, res) {
    try {
      const result = await this.service.login(req, res);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_login

  /*
  * Method: as_logout
  * Description: Handle user logout
  * Route: POST /api/v1/data/user-creds/logout
  * Params: N/A
  * Body: { session_id }, refreshToken from cookies
  * Response: { message }
  * Authorization: No authorization required
  */
  async as_logout(req, res) {
    try {
      const result = await this.service.logout(req, res);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_logout

  /*
  * Method: as_refresh
  * Description: Handle token refresh
  * Route: POST /api/v1/data/user-creds/refresh
  * Params: N/A
  * Body: N/A, uses refreshToken from cookies
  * Response: { message, accessToken }
  * Authorization: No authorization required
  */
  async as_refresh(req, res) {
    try {
      const result = await this.service.refresh(req, res);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_refresh

  /*
  * Method: as_register
  * Description: Handle user registration and an email will be sent after successful registration
  * Route: POST /api/v1/data/user-creds/register
  * Params: N/A
  * Body: { email, password, acc_type (optional, default: 'system') }
  * Response: { message }
  * Authorization: No authorization required
  */
  async as_register(req, res) {
    try {
      const { email, password, acc_type } = req.body;
      const result = await this.service.register({ email, password, acc_type });
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_register

  /*
  * Method: as_generateOtp
  * Description: Generate OTP for email verification
  * Route: POST /api/v1/data/user-creds/generate-otp
  * Params: N/A
  * Body: { email }
  * Response: { message, token }
  * Authorization: No authorization required
  */
  async as_generateOtp(req, res) {
    try {
      const { email } = req.body;
      const result = await this.service.generateOtp(email);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_generateOtp

  /*
  * Method: as_verifyOtp
  * Description: Verify OTP for email verification
  * Route: POST /api/v1/data/user-creds/verify
  * Params: N/A
  * Body: { email, otp }
  * Response: { message }
  * Authorization: Requires access token in headers
  */
  async as_verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const decoded = req.user;
      const result = await UserCredsService.verifyOtp(email, otp, decoded);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_veriftyOtp

  /*
  * Method: as_deleteUser
  * Description: Delete a user by email
  * Route: DELETE /api/v1/data/user-creds/delete-user
  * Params: N/A
  * Body: { email }
  * Response: { message }
  * Authorization: Requires access token in headers
  * Only for testing purposes, should be removed in production
  */
  async as_deleteUser(req, res) {
    try {
      const { email } = req.body;
      const result = await this.service.deleteUser(email);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_deleteUser
}

module.exports = new UserCredsController();
