const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');

const mdl_UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: mdl_UserCredentials,
      key: 'user_id'
    }
  },
  name: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'stores given, middle, last, extension name'
  },
  address: {
    type: DataTypes.JSONB,
    comment: 'stores street, brgy, city, province, country, postal_code',
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
}, {
  tableName: 'user_profile',
  timestamps: true
});

mdl_UserProfile.hasOne(mdl_UserCredentials, { foreignKey: 'user_id' })

module.exports = mdl_UserProfile;
