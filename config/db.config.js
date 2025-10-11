const { Sequelize } = require('sequelize');
const dotenv = require("dotenv");

dotenv.config();

const db_sequelize = new Sequelize(process.env.POSTGRE_HOST || '', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: true,
    },
  },
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});


module.exports = db_sequelize;
