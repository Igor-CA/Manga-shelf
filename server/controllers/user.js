const User = require("../models/User")
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const passport = require('passport');

exports.signup = [

    body("username")
        .trim()
        .notEmpty()
        .withMessage('User name must be specified.')
        .escape(),
    body("password")
        .trim()
        .notEmpty()
        .withMessage('Password must be specified.')
        .escape(),
    body("email")
        .trim()
        .notEmpty()
        .withMessage('Email must be specified.')
        .escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        
        const {username, password , email} = req.body

        const ExistingUser = await User.find().or([{username}, {email}]).limit(1)
        
        if(ExistingUser.length === 0){
            const newUser = new User({username, password, email})
            await newUser.save();
            res.status(201).json({ message: 'User created successfully' });
        }else{
            res.status(409).json({ message: 'Email or username is already in use' });
        }
    })
]

const passport = require('passport');

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      // Authentication failed, send error response
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Successful authentication, log in the user
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      // Send a success response
      return res.status(200).json({ message: 'Authentication successful', user: user });
    });
  })(req, res, next);
};