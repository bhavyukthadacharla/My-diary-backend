const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postTitle: { type: String, required: true },
  postDescription: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
