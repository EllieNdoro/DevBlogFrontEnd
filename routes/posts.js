// Top-level of the file (router setup)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const BlogPost = require('../models/BlogPost');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const { Readable } = require('stream');

// Use the same upload directory as server.js
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const posts = await BlogPost.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'username');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// REMOVE disk storage (UPLOAD_DIR + multer.diskStorage) and use memory storage for GridFS
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, content } = req.body;
    let imageUrl = null;

    if (req.file) {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const filename = Date.now() + path.extname(req.file.originalname);

      const readable = new Readable();
      readable._read = () => {};
      readable.push(req.file.buffer);
      readable.push(null);

      const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype });
      await new Promise((resolve, reject) => {
        readable.pipe(uploadStream).on('error', reject).on('finish', resolve);
      });

      imageUrl = `/uploads/${uploadStream.id.toString()}`;
    }

    const post = new BlogPost({
      title,
      subtitle,
      content,
      author: req.user.id,
      imageUrl
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, content } = req.body;
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    post.title = title;
    post.subtitle = subtitle;
    post.content = content;

    if (req.file) {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const filename = Date.now() + path.extname(req.file.originalname);

      const readable = new Readable();
      readable._read = () => {};
      readable.push(req.file.buffer);
      readable.push(null);

      const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype });
      await new Promise((resolve, reject) => {
        readable.pipe(uploadStream).on('error', reject).on('finish', resolve);
      });

      post.imageUrl = `/uploads/${uploadStream.id.toString()}`;
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await post.deleteOne();
    
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;