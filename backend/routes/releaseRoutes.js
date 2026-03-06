import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { createRelease, getReleasesForProject, updateReleaseStatus } from '../controllers/releaseController.js';

const router = express.Router();

router.route('/').post(protect, createRelease);
router.route('/project/:projectId').get(protect, getReleasesForProject);
router.route('/:id').put(protect, updateReleaseStatus);

export default router;
