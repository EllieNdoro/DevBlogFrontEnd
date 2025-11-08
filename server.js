const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const isProd = process.env.NODE_ENV === 'production';
const mongoUri = process.env.MONGO_URI;

if (isProd && !mongoUri) {
  console.error('MONGO_URI is not set. Configure it in Render Environment.');
  process.exit(1);
}

mongoose.connect(mongoUri || 'mongodb://localhost:27017/dev-blog')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Developer Blogging API' });
});

// IMPORTANT: Remove local static serving of uploads
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Stream files from GridFS by id
app.get('/uploads/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const fileId = new ObjectId(req.params.id);
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('file', (file) => {
      res.set('Content-Type', file.contentType || 'application/octet-stream');
    });
    downloadStream.on('error', () => {
      res.status(404).json({ message: 'File not found' });
    });
    downloadStream.pipe(res);
  } catch (e) {
    res.status(400).json({ message: 'Invalid file id' });
  }
});
app.get('/uploads/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const fileId = new ObjectId(req.params.id);
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('file', (file) => {
      res.set('Content-Type', file.contentType || 'application/octet-stream');
    });
    downloadStream.on('error', () => {
      res.status(404).json({ message: 'File not found' });
    });
    downloadStream.pipe(res);
  } catch (e) {
    res.status(400).json({ message: 'Invalid file id' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});