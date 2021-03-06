const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const handleError = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
    }
  next(err);
};

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  bcrypt.hash(password, 12) //this is hashing + salting the password. 2nd arg is length for salt  
    .then(hashedPw => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name,
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({ message: 'User created!', userId: result._id })
    })
    .catch(err => {
      handleError(err, next);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        const error = new Error('A user with this email could not be found');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong password');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign({ 
        email: loadedUser.email,
        userId: loadedUser._id.toString()
        },
        'secret', //use a longer secret phrase that the server uses to check the token
        { expiresIn: '1h' }
      );
      res.status(200).json({ token, userId: loadedUser._id.toString()}) 
    })
    .catch(err => {
      handleError(err, next);
    });
};

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
  .then(user => {
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ status: user.status });
  })
  .catch(err => {
    handleError(err, next);
  })
};

exports.updateStatus = (req, res, next) => {
  const newStatus = req.body.status;
  User.findById(req.userId)
  .then(user => {
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    user.status = newStatus;
    return user.save()
  })
  .then(result => {
    res.status(200).json({ message: 'User updated' });
  })
  .catch(err => {
    handleError(err, next);
  })
};