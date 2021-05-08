const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Sttring,
    required: TextTrackCue
  },
  posts: [
    {
    //links posts to users
    type: Schmea.Types.ObjectId,
    ref: 'Post'
  }
]
});

module.exports = mongoose.model('User', userSchema);