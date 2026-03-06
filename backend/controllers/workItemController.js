import asyncHandler from 'express-async-handler';
import WorkItem from '../models/WorkItem.js';
import ProjectMember from '../models/ProjectMember.js';

// Helper to check if user has access to a project
const hasProjectAccess = async (projectId, userId, globalRole) => {
  if (globalRole === 'Admin' || globalRole === 'Super Admin') return true;
  const member = await ProjectMember.findOne({ projectId, userId });
  return !!member;
};

// @desc    Get dashboard tasks for current user
// @route   GET /api/workitems/my-tasks
// @access  Private
export const getMyTasks = asyncHandler(async (req, res) => {
  // Only tasks assigned specifically to the user (not assignToAll)
  const items = await WorkItem.find({ 
    assigneeId: req.user._id,
    assignToAll: false
  })
    .populate('projectId', 'name')
    .sort({ priority: -1, createdAt: -1 });
  
  res.json(items);
});

// @desc    Get tasks assigned by current manager/admin to other users
// @route   GET /api/workitems/assigned-tasks
// @access  Private (Manager/Admin)
export const getAssignedTasks = asyncHandler(async (req, res) => {
  if (req.user.globalRole === 'User') {
    res.status(403); throw new Error('Not authorized to view assigned tasks');
  }

  // Find all tasks where reporter is current user, and it's assigned to someone else
  const items = await WorkItem.find({ 
    reporterId: req.user._id,
    assigneeId: { $ne: null, $ne: req.user._id },
    assignToAll: false
  })
    .populate('projectId', 'name')
    .populate('assigneeId', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(items);
});

// @desc    Create a WorkItem
// @route   POST /api/workitems
// @access  Private
export const createWorkItem = asyncHandler(async (req, res) => {
  const { projectId, type, title, description, priority, assigneeId, parentId, sprintId, dueDate, estimatedHours, storyPoints, environment, assignToAll } = req.body;

  const hasAccess = await hasProjectAccess(projectId, req.user._id, req.user.globalRole);
  if (!hasAccess) {
    res.status(403); throw new Error('Not authorized to create items in this project');
  }

  const workItem = new WorkItem({
    projectId, type, title, description, priority,
    assignToAll: assignToAll !== undefined ? assignToAll : true,
    assigneeId: assigneeId || null,
    reporterId: req.user._id,
    parentId: parentId || null,
    sprintId: sprintId || null,
    dueDate, estimatedHours, storyPoints, environment
  });

  const createdItem = await workItem.save();
  res.status(201).json(createdItem);
});

// @desc    Get all WorkItems for a project
// @route   GET /api/workitems/project/:projectId
// @access  Private
export const getWorkItemsForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const hasAccess = await hasProjectAccess(projectId, req.user._id, req.user.globalRole);
  if (!hasAccess) {
    res.status(403); throw new Error('Not authorized to view items in this project');
  }

  const items = await WorkItem.find({ projectId })
    .populate('assigneeId', 'name avatar')
    .populate('reporterId', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(items);
});

// @desc    Get WorkItem by ID
// @route   GET /api/workitems/:id
// @access  Private
export const getWorkItemById = asyncHandler(async (req, res) => {
  const item = await WorkItem.findById(req.params.id)
    .populate('assigneeId', 'name avatar')
    .populate('reporterId', 'name avatar')
    .populate('projectId', 'name')
    .populate('parentId', 'title type status');

  if (item) {
    const hasAccess = await hasProjectAccess(item.projectId, req.user._id, req.user.globalRole);
    if (!hasAccess) {
      res.status(403); throw new Error('Not authorized to view this item');
    }
    res.json(item);
  } else {
    res.status(404); throw new Error('WorkItem not found');
  }
});

// @desc    Update WorkItem
// @route   PUT /api/workitems/:id
// @access  Private
export const updateWorkItem = asyncHandler(async (req, res) => {
  const item = await WorkItem.findById(req.params.id);

  if (item) {
    const hasAccess = await hasProjectAccess(item.projectId, req.user._id, req.user.globalRole);
    if (!hasAccess) {
      res.status(403); throw new Error('Not authorized to update this item');
    }

    if (req.body.status && req.body.status !== item.status) {
      if (!item.assignToAll && req.user.globalRole === 'User') {
         if (item.assigneeId?.toString() !== req.user._id.toString()) {
           res.status(403); throw new Error('Only the assigned user can update this task state');
         }
      }
    }

    // Editing title/description access check
    const isEditingMeta = req.body.title !== undefined || req.body.description !== undefined || req.body.priority !== undefined;
    if (isEditingMeta && req.user.globalRole === 'User') {
      const isReporter = item.reporterId.toString() === req.user._id.toString();
      if (!isReporter) {
         res.status(403); throw new Error('You can only edit details of tasks you created.');
      }
    }

    item.assignToAll = req.body.assignToAll !== undefined ? req.body.assignToAll : item.assignToAll;
    item.title = req.body.title || item.title;
    item.description = req.body.description !== undefined ? req.body.description : item.description;
    item.type = req.body.type || item.type;
    item.priority = req.body.priority || item.priority;
    item.status = req.body.status || item.status;
    item.assigneeId = req.body.assigneeId !== undefined ? req.body.assigneeId : item.assigneeId;
    item.sprintId = req.body.sprintId !== undefined ? req.body.sprintId : item.sprintId;
    item.dueDate = req.body.dueDate !== undefined ? req.body.dueDate : item.dueDate;
    item.estimatedHours = req.body.estimatedHours !== undefined ? req.body.estimatedHours : item.estimatedHours;
    item.storyPoints = req.body.storyPoints !== undefined ? req.body.storyPoints : item.storyPoints;
    item.environment = req.body.environment !== undefined ? req.body.environment : item.environment;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } else {
    res.status(404); throw new Error('WorkItem not found');
  }
});

// @desc    Delete WorkItem
// @route   DELETE /api/workitems/:id
// @access  Private
export const deleteWorkItem = asyncHandler(async (req, res) => {
  const item = await WorkItem.findById(req.params.id);

  if (item) {
    const member = await ProjectMember.findOne({ projectId: item.projectId, userId: req.user._id });
    const isManagerOrAdmin = (member && member.roleInProject === 'Manager') || req.user.globalRole === 'Admin' || req.user.globalRole === 'Super Admin';
    const isReporter = item.reporterId.toString() === req.user._id.toString();

    if (isManagerOrAdmin || isReporter) {
      await WorkItem.deleteOne({ _id: item._id });
      res.json({ message: 'WorkItem removed' });
    } else {
      res.status(403); throw new Error('Not authorized to delete this item');
    }
  } else {
    res.status(404); throw new Error('WorkItem not found');
  }
});
