const UserCredsService = require('./UserCreds.srv');

class UserCredsController {
  constructor() {
    this.service = UserCredsService;
    this.as_register = this.as_register.bind(this);
    this.as_generateOtp = this.as_generateOtp.bind(this);
    this.as_verifyOtp = this.as_verifyOtp.bind(this);
    this.as_deleteUser = this.as_deleteUser.bind(this);
  }

  async as_register(req, res) {
    const { username, email, password, acc_type } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const result = await this.service.register({ username, email, password, acc_type });
    res.status(201).json(result);
  }

  async as_generateOtp(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const result = await this.service.generateOtp(email);
    res.status(200).json(result);
  }

  async as_verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const decoded = req.user;
      const result = await UserCredsService.verifyOtp(email, otp, decoded);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async as_deleteUser(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const result = await this.service.deleteUser(email);
    res.status(200).json(result);
  }
}

module.exports = new UserCredsController();
