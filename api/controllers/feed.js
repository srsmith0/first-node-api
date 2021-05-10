const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator')

const Post = require('../models/post');

const handleError = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
    }
  next(err);
};

exports.getPosts = (req, res, next) => {
  //for pagination, page is query paramenter on front end
  const currentPage = req.query.page || 1;
  console.log(req.query.page)
  console.log(currentPage)
  const perPage = 2;
  let totalItems;
  Post.find().countDocuments()
  .then(count => {
    totalItems = count;
    return Post.find()
      .skip((currentPage - 1) * perPage) //main pagination logic
      .limit(perPage);
  })
  .then(posts => {
    res.status(200).json({ posts, totalItems });
  })
  .catch(err => {
    handleError(err, next)
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(('Validation failed'));
    error.statusCode = 422
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode(422);
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
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

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(('Validation failed'));
    error.statusCode = 422
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file uploaded');
    error.status(422);
    throw error;
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then(result => {
      res.status(200).json({ post: result })
    })
    .catch(err => {
      handleError(err, next);
    })
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      res.status(200).json({ message: 'deleted' })
    })
    .catch(err => {
      handleError(err, next)
    })
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};