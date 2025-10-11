const { Router } = require('express');
const f_authMiddleware = require('../../middlewares/auth.mw');
const UserProfileController = require('./user_profile.ctrl');

const router = Router();

// Protected routes
router.get('/user/:user_id', f_authMiddleware, UserProfileController.as_getUserProfile);
router.post('/', f_authMiddleware, UserProfileController.as_createUserProfile);
router.put('/:user_id', f_authMiddleware, UserProfileController.as_updateUserProfile);
router.delete('/:user_id', f_authMiddleware, UserProfileController.as_deleteUserProfile);

module.exports = router;
