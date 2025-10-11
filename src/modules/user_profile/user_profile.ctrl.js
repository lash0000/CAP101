const UserProfileService = require('./user_profile.srv');

class UserProfileController {
  constructor() {
    // Initialize the service
    this.service = UserProfileService;

    // Bind methods to the class instance
    this.as_getUserProfile = this.as_getUserProfile.bind(this);
    this.as_createUserProfile = this.as_createUserProfile.bind(this);
    this.as_updateUserProfile = this.as_updateUserProfile.bind(this);
    this.as_deleteUserProfile = this.as_deleteUserProfile.bind(this);
  }

  /*
  * Method: as_getUserProfile
  * Description: Get user profile by user ID
  * Route: GET /api/v1/data/profile/user/:user_id
  * Params: { user_id }
  * Body: N/A
  * Response: { user_id, name in JSON (given, middle, last, extension), address in JSON (street, brgy, city, province, country, postal_code,), phone_number, date_of_birth }
  * Authorization: Requires access token in headers
  */
  async as_getUserProfile(req, res) {
    try {
      const { user_id } = req.params;
      const result = await this.service.getUserProfile({ user_id });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_getUserProfile

  /*
  * Method: as_createUserProfile
  * Description: Create a new user profile
  * Route: POST /api/v1/data/profile/
  * Params: N/A
  * Body: { user_id, name in JSON (given, middle, last, extension), address in JSON (street, brgy, city, province, country, postal_code,), phone_number, date_of_birth }
  * Response: { values in body, createdAt, updatedAt }
  * Authorization: Requires access token in headers
  */
  async as_createUserProfile(req, res) {
    try {
      const result = await this.service.createUserProfile(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_createUserProfile

  /*
  * Method: as_updateUserProfile
  * Description: Update user profile by user ID
  * Route: PUT /api/v1/data/profile/:user_id
  * Params: { user_id }
  * Body: { name in JSON (given, middle, last, extension), address in JSON (street, brgy, city, province, country, postal_code,), phone_number, date_of_birth }
  * Response: { values in body, createdAt, updatedAt }
  * Authorization: Requires access token in headers
  */
  async as_updateUserProfile(req, res) {
    try {
      const { user_id } = req.params;
      const result = await this.service.updateUserProfile(user_id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_updateUserProfile

  /*
  * Method: as_deleteUserProfile
  * Description: Delete user profile by user ID
  * Route: DELETE /api/v1/data/profile/:user_id
  * Params: { user_id }
  * Body: N/A
  * Response: { message }
  * Authorization: Requires access token in headers
  */
  async as_deleteUserProfile(req, res) {
    try {
      const { user_id } = req.params;
      const success = await this.service.deleteUserProfile(user_id);
      if (!success) return res.status(404).json({ message: 'User profile not found' });
      return res.status(200).json({ message: 'User profile deleted successfully' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  // -- END OF as_deleteUserProfile
}

module.exports = new UserProfileController();
