const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator')

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

const handleError = (err, next) => {
  if (!err.statusCode) {
    err.statusCode = 500;
    }
  next(err);
};

exports.getPosts = async (req, res, next) => {
  //for pagination, page is query paramenter on front end
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
  const totalItems = await Post.find().countDocuments()
  const posts = await Post.find()
    .populate('creator')
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage) //main pagination logic
    .limit(perPage);
  res.status(200).json({ 
    posts, 
    totalItems 
  });
  } catch (err) {
    handleError(err, next)
  }
};

exports.createPost = async (req, res, next) => {
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
      creator: req.userId
  });
  try {
  await post.save()
  const user = await User.findById(req.userId);
  user.posts.push(post);
  await user.save();
  io.getIO().emit('posts', { action: 'create', post: {...post._doc, creator: {_id: req.userId, name: user.name} }});
  res.status(201).json({
    message: 'Post created successfully!',
          post: post,
          creator: {
            _id: user._id,
            name: user.name
          }
  });
} catch (error) {
  handleError(error, next)
};
  // then/catch promise
  // post.save()
  // .then(result => {
  //   return User.findById(req.userId);
  // })
  // .then(user => {
  //   creator = user;
  //   user.posts.push(post);
  //   return user.save()
  //     .then(result =>{
  //       res.status(201).json({
  //         message: 'Post created successfully!',
  //         post: post,
  //         creator: {
  //           _id: creator._id,
  //           name: creator.name
  //         }
  //       });
  //     })
  // })
  // .catch(err => {
  //   handleError(err, next)
  // });
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
  const post = await Post.findById(postId)
  if (!post) {
      const error = new Error('Cound not find post');
      error.statusCode = 404;
      throw error;
    }
  res.status(200).json({ post });
  } catch (error) {
    handleError(error, next);
  };
 
  // .then(post => {
  //   if (!post) {
  //     const error = new Error('Cound not find post');
  //     error.statusCode = 404;
  //     throw error;
  //   };
  //   res.status(200).json({ post });
  // })
  // .catch(err => {
  //   handleError(err, next);
  // });
};

exports.updatePost = async (req, res, next) => {
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
  try {
  const post = await Post.findById(postId).populate('creator')
    if (!post) {
    const error = new Error('Could not find post.');
    error.statusCode = 404;
    throw error;
  }
  if (post.creator._id.toString() !== req.userId) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }
  if (imageUrl !== post.imageUrl) {
    clearImage(post.imageUrl);
  }
  post.title = title;
  post.imageUrl = imageUrl;
  post.content = content;
  const updatedPost = await post.save();
  io.getIO().emit('posts', { action: 'update', post: updatedPost})
  res.status(200).json({ post: updatedPost});
} catch (error) {
  handleError(error, next);
};
    // .then(post => {
    //   if (!post) {
    //     const error = new Error('Could not find post.');
    //     error.statusCode = 404;
    //     throw error;
    //   }
    //   if(post.creator.toString() !== req.userId) {
    //     const error = new Error('Not authorized');
    //     error.statusCode = 403;
    //     throw error;
    //   }
    //   if (imageUrl !== post.imageUrl) {
    //     clearImage(post.imageUrl);
    //   }
    //   post.title = title;
    //   post.imageUrl = imageUrl;
    //   post.content = content;
    //   return post.save();
    // })
    // .then(result => {
    //   res.status(200).json({ post: result })
    // })
    // .catch(err => {
    //   handleError(err, next);
    // })
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Could not find post.');
    error.statusCode = 404;
    throw error;
  }
  if (post.creator.toString() !== req.userId) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }
  clearImage(post.imageUrl);
  await Post.findByIdAndRemove(postId);
  const user = await User.findById(req.userId);
  await user.posts.pull(postId);
  await user.save();
  io.getIO().emit('posts', { action: 'delete', post: postId })
  res.status(200).json({ message: 'Deleted' })
} catch (error) {
  handleError(error, next);
};
    // .then(post => {
    //   if (!post) {
    //     const error = new Error('Could not find post.');
    //     error.statusCode = 404;
    //     throw error;
    //   }
    //   if(post.creator.toString() !== req.userId) {
    //     const error = new Error('Not authorized');
    //     error.statusCode = 403;
    //     throw error;
    //   }
    //   clearImage(post.imageUrl);
    //   return Post.findByIdAndRemove(postId);
    // })
    // .then(result => {
    //   return user.findById(req.userId);
    // })
    // .then(user => {
    //   user.posts.pull(postId);
    //   return user.save()
    //   .then(result => {
    //     res.status(200).json({ message: 'deleted' })
    //   })
    // })
    // .catch(err => {
    //   handleError(err, next)
    // })
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};