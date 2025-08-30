const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const serverless = require('serverless-http');
const mainRoutes = require('./routes/helper');

dotenv.config();
const app = express();

// Middleware (only apply body parsing where needed, e.g., for POST/PUT)
app.use(cors());

// Home route
app.get('/', (req, res) => {
  res.json({
    project_name: "CAP101 with CockroachDB, REST APIs, SMTP and AWS",
    project_overview: "This empowers AWS Lambda, AWS S3 and CockroachDB.",
    source_code: "https://github.com/lash0000/CAP101",
    version: "0xx",
    api_base_url: "/api/v1/data/{route}",
    description: "A REST API method for CAP101 playbook.",
    available_routes: [
      "/api/v1/data/xxx",
    ]
  });
});

// Use routes
app.use('/api/v1/data', mainRoutes);

// Export handler for Serverless
module.exports.handler = serverless(app);

// Start local server if running outside AWS Lambda
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
