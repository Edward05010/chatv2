const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Extract token (handle "Bearer <token>" format)
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('Token is empty');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    
    console.log('Auth successful for user:', req.userId);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;