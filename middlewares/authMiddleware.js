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
    // Check if Firebase Admin was initialized correctly
    if (!admin.apps || admin.apps.length === 0) {
      console.error("❌ Firebase Admin NOT initialized. Please check your Render environment variables.");
      return res.status(401).json({ message: 'Firebase configuration missing on server' });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find or Create User in local MongoDB
    let user;
    try {
      user = await User.findOne({ firebaseUid: decodedToken.uid });
      if (!user) {
        user = await User.create({
          name: decodedToken.name || decodedToken.email.split('@')[0],
          email: decodedToken.email,
          firebaseUid: decodedToken.uid,
          authProvider: 'google',
          role: 'user'
        });
      }
    } catch (dbError) {
      console.warn("⚠️ Database unreachable during auth. Using temporary session user for demo.");
      // Fallback user for Demo Expo if MongoDB is slow/unreachable
      user = {
        id: decodedToken.uid,
        name: decodedToken.name || "Demo User",
        email: decodedToken.email,
        role: "user"
      };
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    res.status(401).json({ 
      message: 'Authentication failed', 
      reason: error.message 
    });
  }
};
