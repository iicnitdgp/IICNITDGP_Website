const { verifyAccessToken } = require('../utils/jwt');
const User = require('../model/User');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (user && user.isActive) {
      req.user = user;
    }

    return next();
  } catch (err) {
    // If token invalid, don't block public access; just continue without user
    return next();
  }
};

module.exports = optionalAuth;
