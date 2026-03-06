import express from 'express';
import { createSprint, getSprintsByProject } from '../controllers/sprintController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.route('/').post(protect, createSprint);
router.route('/project/:projectId').get(protect, getSprintsByProject);

export default router;
