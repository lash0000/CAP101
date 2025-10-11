const mdl_userProfile = require('./user_profile.mdl');
const sequelize = require('../../../config/db.config');

class UserProfileService {
  constructor() {
    // Initialize the model
    this.model = mdl_userProfile;

    // Bind methods
    this.getUserProfile = this.getUserProfile.bind(this);
    this.createUserProfile = this.createUserProfile.bind(this);
    this.updateUserProfile = this.updateUserProfile.bind(this);
    this.deleteUserProfile = this.deleteUserProfile.bind(this);
  }

  /*
  * Method: getUserProfile
  * Description: Get user profile by user ID
  * Route: POST /api/v1/data/profile/user/:user_id
  * Controller: UserProfileController.as_getUserProfile
  * Body: N/A
  * Response: { user_id, name in JSON (given, middle, last, extension), address in JSON (street, brgy, city, province, country, postal_code,), phone_number, date_of_birth }
  * Authorization: Requires access token in headers
  */
  async getUserProfile({ user_id }) {
    try {
      // Validate input
      if (!user_id) throw new Error('User ID is required');

      // Fetch user profile from the database
      const profile = await this.model.findOne({
        where: { user_id }
      });

      if (!profile) throw new Error('User profile not found');

      return profile;
    } catch (error) {
      throw error;
    }
  }
  // -- END OF getUserProfile --

  /*
  * Method: createUserProfile
  * Description: Create a new user profile
  * Route: POST /api/v1/data/profile
  * Controller: UserCredsController.as_login
  * Body: { user_id, name in JSON (given, middle, last, extension), address in JSON (street, brgy, city, province, country, postal_code,), phone_number, date_of_birth }
  * Response: { values in body, createdAt, updatedAt }
  * Authorization: Requires access token in headers
  */
  async createUserProfile(profileData) {
    const transaction = await sequelize.transaction();

    try {
      // Create new user profile
      const newProfile = await this.model.create(profileData, { transaction });

      // Commit DB Transaction
      await transaction.commit();

      return newProfile;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  // -- END OF createUserProfile --

  /*
  * Method: updateUserProfile
  * Description: Update user profile by user ID
  * Route: PUT /api/v1/data/profile/:user_id
  * Controller: UserProfileController.as_updateUserProfile
  * Body: { name in JSON (given, middle, last, extension), address in JSON (street, brgy, city, province, country, postal_code,), phone_number, date_of_birth }
  * Response: { values in body, createdAt, updatedAt }
  * Authorization: Requires access token in headers
  */
  async updateUserProfile(user_id, updateData) {
    const transaction = await sequelize.transaction();
    try {
      if (!user_id) throw new Error('User ID is required');

      const [updatedRows] = await this.model.update(updateData, {
        where: { user_id },
        returning: true,
        transaction
      });

      if (updatedRows === 0) throw new Error('User profile not found');

      await transaction.commit();

      return await this.getUserProfile({ user_id });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating user profile:', error.message);
      throw error;
    }
  }

  /*
  * Method: deleteUserProfile
  * Description: Delete user profile by user ID
  * Route: DELETE /api/v1/data/profile/:user_id
  * Controller: UserProfileController.as_deleteUserProfile
  * Body: N/A
  * Response: true if deleted, false otherwise
  * Authorization: Requires access token in headers
  */
  async deleteUserProfile(user_id) {
    try {
      if (!user_id) throw new Error('User ID is required');

      const deletedRows = await this.model.destroy({
        where: { user_id }
      });

      return deletedRows > 0;
    } catch (error) {
      console.error('Error deleting user profile:', error.message);
      throw error;
    }
  }
  // -- END OF deleteUserProfile --
}

module.exports = new UserProfileService();
