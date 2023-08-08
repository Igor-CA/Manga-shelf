const User = require("../models/User")
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

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

      const [ExistingUser] = await User.find().or([{username}, {email}]).limit(1)
        
      if(!ExistingUser){
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new User({
          username, 
          password: hashedPassword, 
          email
        })
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
      }else{
        res.status(409).json({ message: 'Email or username is already in use' });
      }
  })
]

exports.login = [

  body("login")
        .trim()
        .notEmpty()
        .withMessage('User name or e-mail must be specified.')
        .escape(),
  body("password")
      .trim()
      .notEmpty()
      .withMessage('Password must be specified.')
      .escape(),

  asyncHandler(async (req, res, next) => {
    const [user] = await User.find().or([{ username:req.body.login }, { email:req.body.login }]).limit(1)
    if (!user) {
      res.send({msg:"No user exists"});
      return;
    }

    const compareResult = await bcrypt.compare(req.body.password, user.password);
    if (compareResult) {
      req.logIn(user, err => {
        if (err) throw err;
        res.send({msg:"Successfully authenticated"});
      });
    } else { 
      res.send({msg: "Incorrect password"});
    }
  })
]

exports.test = (req, res) => {
  console.log(req.user) 
  res.send(req.user)
}