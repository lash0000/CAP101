const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');
const UserAuth = require('../user_auth/UserAuth.model');

const UserProfile = sequelize.define('UserProfile', {
  profile_log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: UserAuth,
      key: 'user_id'
    }
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  middle_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  suffix: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  birthdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  type_of_residency: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'user_profile',
  timestamps: true
});

// cardinality: one to many
UserProfile.belongsTo(UserAuth, { foreignKey: 'user_id' });

module.exports = UserProfile;
