const express = require('express');
const router = express.Router();

class Routes {
  constructor() {
    this.initRoutes();
  }

  initRoutes() {
    router.get('/landing-articles', (req, res) => {
      res.json({
        message: 'Object Oriented Code.'
      })
    })
  }

  getRouter() {
    return router;
  }
}

module.exports = new Routes().getRouter();
