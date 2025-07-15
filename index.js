const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Models and DB connection
const connectDB = require('./db');
const User = require('./User');
const Post = require('./Post');

connectDB();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));


app.get('/', (req, res) => {
  res.send("Backend is running");
});

// Serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
});

// Register
app.post('/registerUser', async (req, res) => {
  const { email, password } = req.body;
  console.log("📥 Incoming registration:", req.body);

  if (!email || !password) {
    console.log("❌ Missing email or password");
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists:", email);
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, hashedPassword });

    await user.save();
    console.log('✅ Registered user:', email);

    return res.status(200).json({ message: 'Registered successfully' });

  } catch (err) {
    console.error('❌ Registration error:', err.message);
    return res.status(500).json({ message: 'Registration failed: ' + err.message });
  }
});


// Login
app.post('/userLogin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send('Email and password required');

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send('User not found');

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) return res.status(401).send('Invalid password');

    console.log('✅ User logged in:', email);
    return res.status(200).json({ userID: email });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).send('Login failed');
  }
});

// New post
app.post('/newPost', async (req, res) => {
  const { postTitle, postDescription, userID } = req.body;
  if (!userID || !postTitle || !postDescription)
    return res.status(400).json({ message: 'All fields required' });

  try {
    const user = await User.findOne({ email: userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = new Post({ userID: user._id, postTitle, postDescription });
    await post.save();

    console.log(`📝 New post by ${userID}: ${postTitle}`);
    return res.status(200).json({ message: 'Post created successfully' });
  } catch (err) {
    console.error('❌ Error creating post:', err);
    return res.status(500).json({ message: 'Post creation failed' });
  }
});

// Get posts
app.get('/getMyPosts', async (req, res) => {
  const { userID } = req.query;
  if (!userID) return res.status(400).json({ message: 'userID required' });

  try {
    const user = await User.findOne({ email: userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ userID: user._id }).sort({ created_at: -1 });
    return res.status(200).json(posts);
  } catch (err) {
    console.error('❌ Error fetching posts:', err);
    return res.status(500).json({ message: 'Failed to load posts' });
  }
});

// Delete post
app.delete('/deletePost', async (req, res) => {
  const postID = req.query.postID;

  if (!postID) {
    console.log("❌ No postID received");
    return res.status(400).json({ message: 'Post ID is required' });
  }
  
  try {
    const result = await Post.findByIdAndDelete(postID);
    if (!result) {
      console.log("❌ Post not found in DB:", postID);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log(`🗑️ Deleted post with ID: ${postID}`);
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting post:', err);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
