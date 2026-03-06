import asyncHandler from 'express-async-handler';
import Sprint from '../models/Sprint.js';

// @desc    Create a Sprint
// @route   POST /api/sprints
// @access  Private
export const createSprint = asyncHandler(async (req, res) => {
  const { projectId, name, startDate, endDate, goal } = req.body;
  const sprint = new Sprint({ projectId, name, startDate, endDate, goal });
  const createdSprint = await sprint.save();
  res.status(201).json(createdSprint);
});

// @desc    Get Sprints for Project
// @route   GET /api/sprints/project/:projectId
// @access  Private
export const getSprintsByProject = asyncHandler(async (req, res) => {
  const sprints = await Sprint.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
  res.json(sprints);
});
