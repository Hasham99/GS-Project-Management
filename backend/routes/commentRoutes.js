import express from 'express';
import { addComment, getComments } from '../controllers/commentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.route('/').post(protect, addComment);
router.route('/workitem/:workItemId').get(protect, getComments);

export default router;
