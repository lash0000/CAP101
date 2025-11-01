const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes_v1 = require('./src/utils/routes_v1.utils');
const sequelize = require('./config/db.config');

dotenv.config();
const app = express();

app.set('trust proxy', 1);

// JSON + URL-encoded payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(
  cors({
    origin: [
      "https://barangay-santa-monica.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

app.use(cookieParser());

// Mount routes
app.use('/api/v1/data', routes_v1);

// Base route
app.get('/', (req, res) => {
  res.json({
    project_name: "Barangay Santa Monica Services",
    version: "1.0.0",
    description: "A REST API for Barangay Santa Monica.",
    available_routes: ["/api/v1/data/..."]
  });
});

// PostgreSQL connection check
const db_postgres_connection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database is connected YAAY');
  } catch (err) {
    console.error('Database connection error:', err);
    setTimeout(db_postgres_connection, 5000);
  }
};
db_postgres_connection();

// Start server (Azure & local friendly)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
