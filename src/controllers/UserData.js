const { Router } = require('express');
const Users = require('../models/Users');

class UserDataController {
  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/profile/:userId', this.getProfile.bind(this));
    this.router.put('/profile/:userId', this.updateProfile.bind(this));
  }

  async getProfile(req, res) {
    try {
      const profile = await Users.findOne({ where: { user_id: parseInt(req.params.userId, 10) } });
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const profile = await Users.findOne({ where: { user_id: parseInt(req.params.userId, 10) } });
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      await profile.update(req.body);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new UserDataController().getRouter();
