module.exports = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');

  try {
    const authHeader = req.header('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ error: 'Please authenticate.' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).send({ error: 'Please authenticate.' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};