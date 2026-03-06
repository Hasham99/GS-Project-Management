import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';

// @desc    Add a comment
// @route   POST /api/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const { workItemId, message } = req.body;
  const comment = new Comment({ workItemId, userId: req.user._id, message });
  const createdComment = await comment.save();
  
  // populate user info before returning
  await createdComment.populate('userId', 'name avatar');
  res.status(201).json(createdComment);
});

// @desc    Get comments for WorkItem
// @route   GET /api/comments/workitem/:workItemId
// @access  Private
export const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ workItemId: req.params.workItemId })
    .populate('userId', 'name avatar')
    .sort({ createdAt: 1 });
  res.json(comments);
});
