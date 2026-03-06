import express from 'express';
import {
  authUser,
  registerUser,
  registerAdmin,
  inviteUser,
  logoutUser,
  getUserProfile,
  getUsers,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, getUsers);
router.post('/admin-register', registerAdmin);
router.post('/invite', protect, inviteUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.route('/profile').get(protect, getUserProfile);

export default router;
