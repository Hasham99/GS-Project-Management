import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin config
export const admin = (req, res, next) => {
  if (req.user && req.user.globalRole === 'Admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an Admin');
  }
};

// Manager config
export const managerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.globalRole === 'Admin' || req.user.globalRole === 'Manager')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized for this action');
  }
};
