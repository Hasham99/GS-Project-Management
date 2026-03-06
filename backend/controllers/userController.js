import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.status === 'Inactive') {
      res.status(401);
      throw new Error('Your account is inactive. Please contact admin.');
    }

    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      globalRole: user.globalRole,
      avatar: user.avatar,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      globalRole: user.globalRole,
      avatar: user.avatar,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Register a new Admin
// @route   POST /api/users/admin-register
// @access  Public
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400); throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    globalRole: 'Admin', // Force Admin role
  });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      globalRole: user.globalRole,
      avatar: user.avatar,
    });
  } else {
    res.status(400); throw new Error('Invalid user data');
  }
});

// @desc    Invite a new user (creates account with default password)
// @route   POST /api/users/invite
// @access  Private (Admin/Manager)
export const inviteUser = asyncHandler(async (req, res) => {
  const { name, email, globalRole } = req.body;

  if (req.user.globalRole === 'User') {
    res.status(403); throw new Error('Not authorized to invite users');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400); throw new Error('User already exists');
  }

  // Create user with a default password (e.g., 'Welcome123!')
  // In a real app, this would send an email with a setup link
  const user = await User.create({
    name,
    email,
    password: 'Welcome123!',
    globalRole: globalRole || 'User',
  });

  if (user) {
    res.status(201).json({
      message: 'User invited successfully. Default password is: Welcome123!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
      }
    });
  } else {
    res.status(400); throw new Error('Invalid user data');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      globalRole: user.globalRole,
      avatar: user.avatar,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users (for assigning to projects/tasks)
// @route   GET /api/users
// @access  Private
// @queries search
export const getUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const users = await User.find({ ...keyword }).select('-password');
  res.json(users);
});
