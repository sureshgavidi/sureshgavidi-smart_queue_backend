const admin = require('firebase-admin');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find or Create User in local MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.create({
        name: decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        firebaseUid: decodedToken.uid,
        authProvider: 'google',
        role: 'user' // Default role
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
