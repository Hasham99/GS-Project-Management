import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import User from '../models/User.js';
import WorkItem from '../models/WorkItem.js';

export const createProject = asyncHandler(async (req, res) => {
  if (req.user.globalRole === 'User') {
    res.status(403); throw new Error('Not authorized to create projects');
  }
  const { name, description, priority, startDate, endDate } = req.body;
  const tenantId = req.user.tenantId || req.user._id;
  const project = new Project({ name, description, priority, startDate, endDate, createdBy: req.user._id, tenantId });
  const createdProject = await project.save();
  await ProjectMember.create({ projectId: createdProject._id, userId: req.user._id, roleInProject: 'Manager' });
  res.status(201).json(createdProject);
});

export const getMyProjects = asyncHandler(async (req, res) => {
  if (req.user.globalRole === 'Super Admin') {
    const projects = await Project.find({ isDeleted: false })
      .populate('createdBy', 'name email avatar').sort({ createdAt: -1 });
    const projectsWithRoles = projects.map(p => ({ ...p.toObject(), myRole: 'Super Admin' }));
    return res.json(projectsWithRoles);
  }

  if (req.user.globalRole === 'Admin') {
    const projects = await Project.find({ tenantId: req.user._id, isDeleted: false })
      .populate('createdBy', 'name email avatar').sort({ createdAt: -1 });
    const projectsWithRoles = projects.map(p => ({ ...p.toObject(), myRole: 'Admin' }));
    return res.json(projectsWithRoles);
  }

  const memberships = await ProjectMember.find({ userId: req.user._id }).select('projectId roleInProject');
  const projectIds = memberships.map((m) => m.projectId);
  const projects = await Project.find({ _id: { $in: projectIds }, isDeleted: false })
    .populate('createdBy', 'name email avatar').sort({ createdAt: -1 });
  const projectsWithRoles = projects.map(p => {
    const membership = memberships.find(m => m.projectId.toString() === p._id.toString());
    return { ...p.toObject(), myRole: membership.roleInProject };
  });
  res.json(projectsWithRoles);
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
    .populate('createdBy', 'name email avatar');
  if (project) {
    if (req.user.globalRole === 'Super Admin') {
      return res.json({ ...project.toObject(), myRole: 'Super Admin' });
    }
    
    if (req.user.globalRole === 'Admin' && project.tenantId.toString() === req.user._id.toString()) {
      return res.json({ ...project.toObject(), myRole: 'Admin' });
    }

    const membership = await ProjectMember.findOne({ projectId: project._id, userId: req.user._id });
    if (membership) {
      res.json({ ...project.toObject(), myRole: membership.roleInProject });
    } else {
      res.status(403); throw new Error('Not authorized to access this project');
    }
  } else {
    res.status(404); throw new Error('Project not found');
  }
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Manager)
export const updateProject = asyncHandler(async (req, res) => {
  const { name, description, priority, status, startDate, endDate } = req.body;
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (project) {
    const membership = await ProjectMember.findOne({ projectId: project._id, userId: req.user._id });
    const isSuperAdmin = req.user.globalRole === 'Super Admin';
    const isAdmin = req.user.globalRole === 'Admin' && project.tenantId.toString() === req.user._id.toString();
    const isManager = membership && membership.roleInProject === 'Manager';

    if (isSuperAdmin || isAdmin || isManager) {
      project.name = name || project.name;
      project.description = description || project.description;
      project.priority = priority || project.priority;
      project.status = status || project.status;
      project.startDate = startDate || project.startDate;
      project.endDate = endDate || project.endDate;

      const updatedProject = await project.save();
      res.json(updatedProject);
    } else {
      res.status(403); throw new Error('Not authorized as Manager');
    }
  } else {
    res.status(404); throw new Error('Project not found');
  }
});

// @desc    Delete (soft delete) a project
// @route   DELETE /api/projects/:id
// @access  Private (Manager/Admin)
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (project) {
    const membership = await ProjectMember.findOne({ projectId: project._id, userId: req.user._id });
    const isSuperAdmin = req.user.globalRole === 'Super Admin';
    const isAdmin = req.user.globalRole === 'Admin' && project.tenantId.toString() === req.user._id.toString();
    const isManager = membership && membership.roleInProject === 'Manager';

    if (isSuperAdmin || isAdmin || isManager) {
      project.isDeleted = true;
      await project.save();
      res.json({ message: 'Project removed' });
    } else {
      res.status(403); throw new Error('Not authorized as Manager');
    }
  } else {
    res.status(404); throw new Error('Project not found');
  }
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Manager)
export const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });
  
  if (project) {
    const mgrCheck = await ProjectMember.findOne({ projectId: project._id, userId: req.user._id });
    const isSuperAdmin = req.user.globalRole === 'Super Admin';
    const isAdmin = req.user.globalRole === 'Admin' && project.tenantId.toString() === req.user._id.toString();
    const isManager = mgrCheck && mgrCheck.roleInProject === 'Manager';

    if (isSuperAdmin || isAdmin || isManager) {
      const alreadyMember = await ProjectMember.findOne({ projectId: project._id, userId });
      if (alreadyMember) {
        res.status(400); throw new Error('User is already a member');
      }
      const member = await ProjectMember.create({ projectId: project._id, userId, roleInProject: role || 'Viewer' });
      res.status(201).json(member);
    } else {
      res.status(403); throw new Error('Not authorized as Manager');
    }
  } else {
    res.status(404); throw new Error('Project not found');
  }
});

// @desc    Get project members
// @route   GET /api/projects/:id/members
// @access  Private
export const getMembers = asyncHandler(async (req, res) => {
  const members = await ProjectMember.find({ projectId: req.params.id }).populate('userId', 'name email avatar');
  res.json(members);
});

// @desc    Get project analytics
// @route   GET /api/projects/:id/analytics
// @access  Private (Manager/Admin)
export const getProjectAnalytics = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const project = await Project.findById(projectId);
  
  if (!project) {
    res.status(404); throw new Error('Project not found');
  }

  const hasAccess = await ProjectMember.findOne({ projectId, userId: req.user._id });
  const isSuperAdmin = req.user.globalRole === 'Super Admin';
  const isAdmin = req.user.globalRole === 'Admin' && project.tenantId.toString() === req.user._id.toString();

  if (!isSuperAdmin && !isAdmin && !hasAccess) {
    res.status(403); throw new Error('Not authorized to view analytics');
  }

  // Aggregate work items by status
  const statusCounts = await WorkItem.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Aggregate work items by priority
  const priorityCounts = await WorkItem.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // Workload: count of incomplete tasks per assignee
  const workload = await WorkItem.aggregate([
    { $match: { 
        projectId: new mongoose.Types.ObjectId(projectId),
        status: { $ne: 'Done' },
        assigneeId: { $ne: null }
    }},
    { $group: { _id: '$assigneeId', count: { $sum: 1 } } },
    { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
    }},
    { $unwind: '$user' },
    { $project: { name: '$user.name', count: 1, _id: 1 } }
  ]);

  const totalTasks = await WorkItem.countDocuments({ projectId });
  const completedTasks = await WorkItem.countDocuments({ projectId, status: 'Done' });
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  res.json({
    statusCounts,
    priorityCounts,
    workload,
    summary: {
      totalTasks,
      completedTasks,
      completionRate
    }
  });
});
