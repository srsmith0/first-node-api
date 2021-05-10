const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth')

const router = express.Router();

router.put('/signup', [
  body('email')
    .isEmail()
    .withMessage('Please enter  valid email')
    .custom((value, { req }) => { //validation to make sure email does not exist already
      return User.findOne({ email: value })
        .then(userDoc => {
          if (userDoc) {
            return Promise.reject('Email already in use');
          }
        })
    })
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 5 }),
  body('name')
    .trim()
    .not()
    .isEmpty()
], 
authController.signUp
);

router.post('/login', authController.login);

module.exports = router;  