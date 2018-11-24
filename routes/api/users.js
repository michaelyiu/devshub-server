const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('./../../config/keys');
const passport = require('passport');


// Load Input Validation
const validateRegisterInput = require('./../../validation/register')
const validateLoginInput = require('./../../validation/login')
// load user model
const User = require('./../../models/User');


// @route   GET api/users/test
// @desc    Tests users route
// @access  Public route
router.get('/test', (req, res) => res.json({ msg: "Users Works " }));


// @route   POST api/users/register
// @desc    Register user
// @access  Public route
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  //find one user by email in mongoose db
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        errors.email = 'Email already exists';
        return res.status(400).json(errors)
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: '200', //Size
          r: 'pg',  //rating
          d: 'mm'   //default
        })
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password

        });

        //encrypt password and salt it 10x
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err))
          });
        });

      }
    })
});

// @route   GET api/users/login
// @desc    Login User / Returning JWT token
// @access  Public route
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email }).then(user => {
    // Check for user
    if (!user) {
      errors.email = 'User not found';
      return res.status(404).json(errors);
    }

    // Check Password from the form to the password in user database
    //bcrypt compare returns a promise true/false in isMatch
    bcrypt.compare(password, user.password)
      .then(isMatch => {
        if (isMatch) {
          // User matched

          const payload = {
            id: user.id, name: user.name, avatar: user.avatar
          } //Create JWT Payload

          //Sign jwt token
          jwt.sign(
            payload,
            keys.secret,
            { expiresIn: 3600 },
            (err, token) => {
              res.header('x-auth', token).send(
                res.json({
                  success: true,
                  token: 'Bearer ' + token
                }))
              // res.header('x-auth', token).send(token)
            });
        }
        else {
          errors.password = 'Password incorrect';
          return res.status(400).json(errors);
        };
      });
  });
});

// @route   GET api/users/current
// @desc    Reeturn current user
// @access  Private route
router.get('/current',
  passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    })
  })

module.exports = router;