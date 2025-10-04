const { sendEmail } = require('../../../services/nodemailer');
const emailTemplate = require('../../../services/email.template');
const UserAuth = require('./UserAuth.model');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

class UserAuthController {

}

module.exports = new UserAuthController();
