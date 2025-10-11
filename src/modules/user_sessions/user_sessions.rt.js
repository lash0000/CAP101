const { Router } = require('express');
const authMiddleware = require('../../../middleware/auth.mw');
const UserSessionsController = require('./UserSessions.ctrl');

const router = Router();

// router.post('/login', UserSessionsController.as_login);
// router.post('/refresh', UserSessionsController.as_refreshToken);
// router.post('/logout', authMiddleware, UserSessionsController.as_logout);
// router.delete('/cleanup', authMiddleware, UserSessionsController.as_cleanupExpiredSessions);

module.exports = router;
