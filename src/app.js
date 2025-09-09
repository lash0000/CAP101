const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const serverless = require('serverless-http');
const mainRoutes = require('./routes/helper');
const sequelize = require('./config/db.config');
const redis = require('redis');

dotenv.config();
const app = express();

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected successfully');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    setTimeout(connectRedis, 5000);
  }
};
connectRedis();

// To allow be interact with controllers
app.locals.redisClient = redisClient;

// To allow JSON Body Requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Use routes
app.use('/api/v1/data', mainRoutes);

// Main route
app.get('/', (req, res) => {
  res.json({
    project_name: "CAP101 x CockroachDB",
    project_overview: "Serverless architecture via REST with Sequelize, Nodemailer & AWS S3.",
    source_code: "https://github.com/lash0000/CAP101",
    version: "0xx",
    api_base_url: "/api/v1/data/{route}",
    description: "A REST API method for CAP101 playbook.",
    available_routes: [
      "/api/v1/data/users",
      "/api/v1/data/xxx"
    ]
  });
});

// Sequelize (ORM) thru my postgre
const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database is connected YAAY');
  } catch (err) {
    console.error('Database connection error:', err);
    setTimeout(testDbConnection, 5000);
  }
};
testDbConnection();

// Export handler for Serverless
module.exports.handler = serverless(app);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  process.on('SIGINT', async () => {
    await redisClient.quit();
    process.exit(0);
  });
}
