const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

// stored credentials.
//
// TODO: OAuth, username, pwd, phonenumber, country, email_address, account_type (Gmail or system)

const UserAuth = sequelize.define('UserAuth', {
  auth_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  account_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  access_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  expiration: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_auth',
  timestamps: false
});

module.exports = UserAuth;
