const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// import post and profile model
const Post = require('./../../models/Post');
const Profile = require('./../../models/Profile');

// Validation
const validatePostInput = require('./../../validation/post');



// @route   GET api/posts/test
// @desc    Tests posts route
// @access  Public route
router.get('/test', (req, res) => res.json({ msg: "Posts Works " }));

// @route   GET api/post
// @desc    GET post
// @access  Public route
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ noPostFound: 'No post found with that ID' }));
});


// @route   GET api/posts/:id
// @desc    GET posts by id
// @access  Public route
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ noPostFound: 'No post found with that ID' }));
})


// @route   POST api/posts
// @desc    Create post
// @access  Private route
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  if (!isValid) {
    //If any errors, send 400 with errors object
    return res.status(400).json(errors);
  }

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id,
        handle: profile.handle
      })

      newPost.save().then(post => res.json(post));
    })
    //Return nothing since we still want the action to go thru even without a profile
    .catch(err => null)



})


// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private route
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ notAuthorized: 'User not authorized' });
          }

          // Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postNotFound: 'Post not found' }));
    })
})


// @route   POST api/posts/like/:id
// @desc    Post a 'like' post
// @access  Private route
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ alreadyLiked: 'User already liked this post' })
          }

          // Add user id to likes array
          post.likes.unshift({ user: req.user.id });

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postNotFound: 'Post not found' }));
    })
})


// @route   POST api/posts/removelike/:id
// @desc    Post a remove 'like' post
// @access  Private route
router.post('/removelike/:id', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notLiked: 'You have not yet liked this post' });
          }

          // Get remove index
          const removeIndex = post.likes.map(item => item.user.toString())
            .indexOf(req.user.id);

          //Splice out of array
          post.likes.splice(removeIndex, 1);

          //Save
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postNotFound: 'Post not found' }));
    })
  })

// @route   POST api/posts/comment/:id
// @desc    Add comment to post
// @access  Private route
router.post('/comments/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      const { errors, isValid } = validatePostInput(req.body);

      if (!isValid) {
        //If any errors, send 400 with errors object
        return res.status(400).json(errors);
      }
      Profile.findOne({ user: req.user.id })
        .then(profile => {
          const newComment = {
            text: req.body.text,
            name: req.body.name,
            avatar: req.body.avatar,
            user: req.user.id,
            handle: profile.handle
          }
          // Add to comments array
          post.comments.unshift(newComment);

          // Save
          post.save().then(post => res.json(post))
        })


    })
    .catch(err => res.status(404).json({ postNotFound: 'No post found' }));
})

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Remove comment from post
// @access  Private route
router.delete('/comments/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      //Check to see if the comment exists
      if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
        return res.status(404).json({ commentNotFound: 'Comment does not exist' })
      }

      // Get remove index
      const removeIndex = post.comments.map(item => item._id.toString())
        .indexOf(req.params.comment_id);

      //Splice comment out of array
      post.comments.splice(removeIndex, 1);

      post.save().then(post => res.json(post));
    })
    .catch(err => res.status(404).json({ postNotFound: 'No post found' }));
})


module.exports = router;