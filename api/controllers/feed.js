const { validationResult } = require('express-validator')

const Post = require('../models/post');

const handleError = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
    }
  next(err);
}

exports.getPosts = (req, res, next) => {
  Post.find()
  .then(posts => {
    res.status(200).json({ posts });
  })
  .catch(err => {
    handleError(err, next);
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(('Validation failed'));
    error.statusCode = 422
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
      title: title,
      content: content,
      imageUrl: 'images/car.jpg',
      creator: { name: 'Shawn' },
  });
  post.save().then(result => {
    console.log('works"')
    res.status(201).json({
      message: 'Post created successfully!',
      post: result
    });
  })
  .catch(err => {
    handleError(err, next)
  });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
  .then(post => {
    if (!post) {
      const error = new Error('Cound not find post');
      error.statusCode = 404;
      throw error;
    };
    res.status(200).json({ post });
  })
  .catch(err => {
    handleError(err, next);
  });
};
