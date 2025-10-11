const jwt = require('jsonwebtoken');
const geoip = require('geoip-lite');
const useragent = require('useragent');

const UserSessionsModel = require('./user_sessions.mdl');

class UserSessionsService {
  constructor() {
    // Token expiry settings
    this.ACCESS_TOKEN_EXPIRY = '15m';
    this.REFRESH_TOKEN_EXPIRY = '15d';

    // Initialize the user sessions model
    this.sessionModel = UserSessionsModel;

    // Bind methods to the class instance
    this.f_generateAccessToken = this.f_generateAccessToken.bind(this);
    this.f_generateRefreshToken = this.f_generateRefreshToken.bind(this);
    this.f_verifyRefreshToken = this.f_verifyRefreshToken.bind(this);
    this.f_getIPDetails = this.f_getIPDetails.bind(this);
    this.createSession = this.createSession.bind(this);
    this.endSession = this.endSession.bind(this);
  }

  /*
  * Method: f_generateAccessToken
  * Description: Generates a JWT access token
  * Route: N/A
  * Controller: N/A
  * Params: user (object), expires (string, optional)
  * Body: N/A
  * Response: JWT access token (string)
  * Authorization: N/A
  */
  f_generateAccessToken(user, expires = "") {
    return jwt.sign(
      user,
      process.env.JWT_SECRET,
      { expiresIn: expires || this.ACCESS_TOKEN_EXPIRY }
    );
  }

  /*
  * Method: f_generateRefreshToken
  * Description: Generates a JWT refresh token
  * Route: N/A
  * Controller: N/A
  * Params: user (object), expires (string, optional)
  * Body: N/A
  * Response: JWT refresh token (string)
  * Authorization: N/A
  */
  f_generateRefreshToken(user, expires = "") {
    try {
      return jwt.sign(
        user,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: expires || this.REFRESH_TOKEN_EXPIRY }
      );
    }
    catch (error) {
      throw new Error(`Failed to generate refresh token: ${error.message}`);
    }
  }

  /*
  * Method: f_verifyRefreshToken
  * Description: Verifies a JWT refresh token
  * Route: N/A
  * Controller: N/A
  * Params: token (string)
  * Body: N/A
  * Response: Decoded token payload (object) or throws error if invalid
  * Authorization: N/A
  */
  f_verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /*
  * Method: f_getIPDetails
  * Description: Extracts IP and device details from the request
  * Route: N/A
  * Controller: N/A
  * Params: req (Express request object)
  * Body: N/A
  * Response: Object with ip_address, country, region, city, lat, long, device_info
  * Authorization: N/A
  */
  f_getIPDetails(req) {
    try {
      const agent = useragent.parse(req.get('User-Agent') || '');
      console.log(req.get('User-Agent'), agent)
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.ip ||
        req.connection?.remoteAddress ||
        null;

      const geo = ip ? geoip.lookup(ip) : null;

      const info = {
        ip_address: ip,
        country: geo?.country || null,
        region: geo?.region || null,
        city: geo?.city || null,
        lat: geo?.ll ? geo.ll[0] : null,
        long: geo?.ll ? geo.ll[1] : null,
        device_info: agent.toString()
      };

      return info;
    } catch (error) {
      throw new Error(`Failed to get IP details: ${error.message}`);
    }
  }

  /*
  * Method: createSession
  * Description: Creates a new user session
  * Route: N/A
  * Controller: N/A
  * Params: user_id (UUID), req (Express request object), transaction (Sequelize transaction)
  * Body: N/A
  * Response: Created user session object
  * Authorization: N/A
  */
  async createSession(user_id, req, transaction) {
    try {
      const login_info = this.f_getIPDetails(req);

      const user_session = await this.sessionModel.create(
        {
          user_id,
          login_info,
          logout_info: null,
          login_date: new Date()
        },
        { transaction }
      );

      return user_session;
    } catch (error) {
      throw error;
    }
  }

  /*
  * Method: endSession
  * Description: Ends an existing user session
  * Route: N/A
  * Controller: N/A
  * Params: sessionId (BIGINT), req (Express request object), transaction (Sequelize transaction)
  * Body: N/A
  * Response: Message indicating success
  * Authorization: N/A
  */
  async endSession(sessionId, req, transaction) {
    try {
      if (!sessionId) throw new Error('Session ID is required to end session.');

      // Check session exists
      const session = await this.sessionModel.findOne({
        where: { session_id: sessionId },
      });
      if (!session) throw new Error('No active session found.');

      const logout_info = this.f_getIPDetails(req);

      await session.update(
        {
          logout_date: new Date(),
          logout_info
        },
        { where: { session_id: sessionId }, transaction }
      );

      return { message: 'Session ended successfully' };
    } catch (error) {
      throw new Error(`Ending session failed: ${error.message}`);
    }
  }
}

module.exports = UserSessionsService;
