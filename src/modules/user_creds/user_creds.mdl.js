const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

const mdl_UserCredentials = sequelize.define('UserCredentials', {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  acc_type: {
    type: DataTypes.ENUM('System', 'Google'),
    defaultValue: 'system'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'user_credentials',
  timestamps: true
});

module.exports = mdl_UserCredentials;
