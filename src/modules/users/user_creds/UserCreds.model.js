const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

const UserCredentials = sequelize.define('UserCreds', {
  auth_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUIDV4,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  acc_type: {
    type: DataTypes.ENUM('system', 'google'),
    defaultValue: "system"
  },
  access_token: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'user_credentials',
  timestamps: true
});

module.exports = UserCredentials;
