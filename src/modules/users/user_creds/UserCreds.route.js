const { Router } = require('express');
const f_authMiddleware = require('../../../middleware/auth.mw');
const UserCredsController = require('./UserCreds.ctrl');

const router = Router();

router.post('/register', UserCredsController.as_register);
router.post('/generate-otp', UserCredsController.as_generateOtp);
router.post('/verify', f_authMiddleware, UserCredsController.as_verifyOtp);
router.delete('/delete-user', UserCredsController.as_deleteUser);

module.exports = router;
