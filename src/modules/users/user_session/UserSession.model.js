const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');
const UserAuth = require('../user_auth/UserAuth.model');

const UserSessions = sequelize.define('UserSessions', {


}, {
  tableName: 'user_sessions',
  timestamps: true
});

// cardinality: one to many
UserProfile.belongsTo(UserAuth, { foreignKey: 'user_id' });

module.exports = UserSessions;
