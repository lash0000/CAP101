const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

const UserAuth = sequelize.define('UserAuth', {
  auth_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUIDV4,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.VARCHAR(255),
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  acc_type: {
    type: DataTypes.ENUM,
    defaultValue: "system"
  },
  access_token: {
    type: VARCHAR(255),
    allowNull: true
  },
  refresh_token: {
    type: VARCHAR(255),
    allowNull: true
  }
}, {
  tableName: 'user_auth',
  timestamps: true
});

module.exports = UserAuth;
