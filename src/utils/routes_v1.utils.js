const express = require('express');
const userCredsRoutes = require('../modules/user_creds/user_creds.rt');
const userProfileRoutes = require('../modules/user_profile/user_profile.rt');

class mainRoutes {
  constructor() {
    this.router = express.Router();
    this.registerRoutes(this.router);
  }

  registerRoutes(router) {
    router.use('/user-creds', userCredsRoutes);
    router.use('/profile', userProfileRoutes);
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new mainRoutes().getRouter();
