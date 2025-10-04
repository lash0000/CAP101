// This locates our root handler for routes.
const express = require('express');
const userCredsRoutes = require('../modules/users/user_creds/UserCreds.route');

class mainRoutes {
  constructor() {
    this.router = express.Router();
    this.registerRoutes(this.router);
  }

  registerRoutes(router) {
    router.use('/user-creds', userCredsRoutes);
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new mainRoutes().getRouter();
