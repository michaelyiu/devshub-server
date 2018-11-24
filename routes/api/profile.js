const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//Load Validation
const validateProfileInput = require('./../../validation/profile');
const validateExperienceInput = require('./../../validation/experience');
const validateEducationInput = require('./../../validation/education');

//Load Profile and User Model
const Profile = require('./../../models/Profile');
const User = require('./../../models/User');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public route
router.get('/test', (req, res) => res.json({ msg: "Profile Works " }));

// @route   GET api/profile
// @desc    Get current users profile
// @access  Private route
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noProfile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});



// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public route
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noProfile = 'There are no profiles';
        return res.status(404).json();
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profile: 'There are no profiles' }));
});




// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public route
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noProfile = 'There is no profile for this user';
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});




// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public route

router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noProfile = 'There is no profile for this user';
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json({ profile: 'There is no profile for this user' }));
});


// @route   POST api/profile
// @desc    Create or Edit users profile
// @access  Private route
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  const { errors, isValid } = validateProfileInput(req.body);

  //Check Validation
  if (!isValid) {
    //returns any errors with 400 status
    return res.status(400).json(errors);
  }

  //Get fields
  const profileFields = {};
  profileFields.user = req.user.id;
  if (req.body.handle) profileFields.handle = req.body.handle;
  if (req.body.company || req.body.company === "") profileFields.company = req.body.company;
  if (req.body.website || req.body.website === "") profileFields.website = req.body.website;
  if (req.body.location || req.body.location === "") profileFields.location = req.body.location;
  if (req.body.bio || req.body.bio === "") profileFields.bio = req.body.bio;
  if (req.body.status || req.body.status === "") profileFields.status = req.body.status;
  if (req.body.githubUsername || req.body.githubUsername === "") profileFields.githubUsername = req.body.githubUsername;
  if (typeof req.body.skills !== 'undefined') {
    profileFields.skills = req.body.skills.split(',');
  }
  profileFields.social = {};
  if (req.body.youtube || req.body.youtube === "") profileFields.social.youtube = req.body.youtube;
  if (req.body.twitter || req.body.twitter === "") profileFields.social.twitter = req.body.twitter;
  if (req.body.facebook || req.body.facebook === "") profileFields.social.facebook = req.body.facebook;
  if (req.body.linkedin || req.body.linkedin === "") profileFields.social.linkedin = req.body.linkedin;
  if (req.body.instagram || req.body.instagram === "") profileFields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        Profile.findOneAndUpdate(
          { user: req.user.id }, { $set: profileFields }, { new: true }
        ).then(profile => res.json(profile));
      } else {
        //Create

        //Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = 'That handle already exists';
            res.status(400).json(errors);
          }

          //Save Profile
          new Profile(profileFields).save().then(profile => res.json(profile))
        })
      }
    })


});


// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private route
router.post('/experience', passport.authenticate('jwt', { session: false }),
  (req, res) => {

    const { errors, isValid } = validateExperienceInput(req.body);

    //Check Validation
    if (!isValid) {
      //returns any errors with 400 status
      return res.status(400).json(errors);
    }
    console.log(req.body.from);



    Profile.findOne({ user: req.user.id }).then(profile => {

      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description,
      }

      //Add to exp array
      profile.experience.unshift(newExp);
      console.log(newExp);

      profile.save().then(profile => res.json(profile))
    })

  })



// @route   POST api/profile/experience/:exp_id
// @desc    Edit experience to profile
// @access  Private route
router.post('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {

  const { errors, isValid } = validateExperienceInput(req.body);

  // Check Validation
  if (!isValid) {
    // returns any errors with 400 status
    return res.status(400).json(errors);
  }

  const expFields = {};
  if (req.body.title || req.body.title === "") expFields.title = req.body.title;
  if (req.body.company || req.body.company === "") expFields.company = req.body.company;
  if (req.body.location || req.body.title === "") expFields.location = req.body.location;
  if (req.body.from || req.body.from === "") expFields.from = req.body.from;
  if (req.body.to || req.body.to === "") expFields.to = req.body.to;
  expFields.current = req.body.current;
  if (req.body.description || req.body.description === "") expFields.description = req.body.description;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      //Get index
      const index = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);

      Profile.findOneAndUpdate(
        { user: req.user.id }, { $set: { [`experience.${index}`]: expFields } }, { new: true }


      ).then(profile => res.json(profile))
        .catch(err => res.status(400).json(err));
    })
})


// @route   POST api/profile/education/:edu_id
// @desc    Edit education to profile
// @access  Private route
router.post('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {

  const { errors, isValid } = validateEducationInput(req.body);

  // Check Validation
  if (!isValid) {
    // returns any errors with 400 status
    return res.status(400).json(errors);
  }

  const eduFields = {};
  if (req.body.school || req.body.school === "") eduFields.school = req.body.school;
  if (req.body.degree || req.body.degree === "") eduFields.degree = req.body.degree;
  if (req.body.fieldOfStudy || req.body.title === "") eduFields.fieldOfStudy = req.body.fieldOfStudy;
  if (req.body.from || req.body.from === "") eduFields.from = req.body.from;
  if (req.body.to || req.body.to === "") eduFields.to = req.body.to;
  eduFields.current = req.body.current;
  if (req.body.description || req.body.description === "") eduFields.description = req.body.description;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      //Get index
      const index = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);

      Profile.findOneAndUpdate(
        { user: req.user.id }, { $set: { [`education.${index}`]: eduFields } }, { new: true }


      ).then(profile => res.json(profile))
        .catch(err => res.status(400).json(err));
    })
})

// @route   GET api/profile/experience/:exp_id
// @desc    get experience with given id
// @access  Private route
router.get('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      //Get index
      const index = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);

      res.json(profile.experience[index]);
    })
    .catch(err => res.status(404).json(err));
})


// @route   GET api/profile/education/:edu_id
// @desc    get education with given id
// @access  Private route
router.get('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      //Get index
      const index = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);

      res.json(profile.education[index]);
    })
    .catch(err => res.status(404).json(err));
})



// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private route
router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {

  const { errors, isValid } = validateEducationInput(req.body);

  //Check Validation
  if (!isValid) {
    //returns any errors with 400 status
    return res.status(400).json(errors);
  }


  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldOfStudy: req.body.fieldOfStudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description,
      }

      //Add to exp array
      profile.education.unshift(newEdu);

      profile.save().then(profile => res.json(profile))
    });
});



// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience to profile
// @access  Private route
router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      // Get remove index
      const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);

      //Splice out of array
      profile.experience.splice(removeIndex, 1);

      // Save
      profile.save().then(profile => res.json(profile))

    })
    .catch(err => res.status(404).json(err));
});


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education to profile
// @access  Private route
router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      // Get remove index
      const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);

      //Splice out of array
      profile.education.splice(removeIndex, 1);

      // Save
      profile.save().then(profile => res.json(profile))

    })
    .catch(err => res.status(404).json(err));
});

// @route   DELETE api/profile
// @desc    Delete user profile
// @access  Private route
router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOneAndRemove({ user: req.user.id }).then(() => {
    User.findOneAndRemove({ _id: req.user.id }).then(() =>
      res.json({ success: true })
    )
  })
});

module.exports = router;