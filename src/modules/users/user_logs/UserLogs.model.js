const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');
const UserAuth = require('../user_auth/UserAuth.model');

const UserLogs = sequelize.define('UserLogs', {
  user_logs_id: {
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
  log_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'user_logs',
  timestamps: true
});

// cardinality: one to many
UserLogs.belongsTo(UserAuth, { foreignKey: 'user_id' });

module.exports = UserLogs;
