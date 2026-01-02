const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ message: 'User account is deactivated' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if teacher is assigned to the class/group
const checkAssignment = (type) => {
  return async (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params.classId || req.params.groupId || req.body.class || req.body.group;

    if (!resourceId) {
      return next();
    }

    let isAssigned = false;

    if (type === 'class') {
      isAssigned = req.user.assignedClasses.some(
        classId => classId.toString() === resourceId
      );
    } else if (type === 'group') {
      isAssigned = req.user.assignedGroups.some(
        groupId => groupId.toString() === resourceId
      );
    }

    if (!isAssigned) {
      return res.status(403).json({
        message: `You are not assigned to this ${type}`
      });
    }

    next();
  };
};

module.exports = { protect, authorize, checkAssignment };
