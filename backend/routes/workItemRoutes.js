import express from 'express';
import {
  createWorkItem,
  getWorkItemsForProject,
  getWorkItemById,
  updateWorkItem,
  deleteWorkItem,
  getMyTasks,
  getAssignedTasks
} from '../controllers/workItemController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createWorkItem);

router.route('/my-tasks')
  .get(protect, getMyTasks);

router.route('/assigned-tasks')
  .get(protect, getAssignedTasks);

router.route('/project/:projectId')
  .get(protect, getWorkItemsForProject);

router.route('/:id')
  .get(protect, getWorkItemById)
  .put(protect, updateWorkItem)
  .delete(protect, deleteWorkItem);

export default router;
