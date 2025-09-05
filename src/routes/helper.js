const { Router } = require('express');
const userRouter = require('../controllers/UserData');

class Routes {
  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    // Mount userRouter at /users
    this.router.use('/users', userRouter);

    // Define the root route for /api/v1/data/
    this.router.get('/', (req, res) => {
      res.json({
        project_name: "CAP101 with CockroachDB, REST APIs, SMTP and AWS",
        project_overview: "This empowers AWS Lambda, AWS S3 and CockroachDB.",
        source_code: "https://github.com/lash0000/CAP101",
        version: "0xx",
        api_base_url: "/api/v1/data/{route}",
        description: "A REST API method for CAP101 playbook.",
        available_routes: [
          "/api/v1/data/users",
          "/api/v1/data/xxx" // Reflect the actual route
        ]
      });
    });

  }

  getRouter() {
    return this.router;
  }
}

module.exports = new Routes().getRouter();
