import asyncHandler from 'express-async-handler';
import Release from '../models/Release.js';
import WorkItem from '../models/WorkItem.js';
import ProjectMember from '../models/ProjectMember.js';

// Helper to check if user has access to a project
const hasProjectAccess = async (projectId, userId, globalRole) => {
  if (globalRole === 'Admin') return true;
  const member = await ProjectMember.findOne({ projectId, userId });
  return !!member;
};

// @desc    Create a new Release push (Commit to platform)
// @route   POST /api/releases
// @access  Private
export const createRelease = asyncHandler(async (req, res) => {
  const { projectId, platform, version, workItemIds } = req.body;

  const hasAccess = await hasProjectAccess(projectId, req.user._id, req.user.globalRole);
  if (!hasAccess) {
    res.status(403); throw new Error('Not authorized to access this project');
  }

  const release = new Release({
    projectId,
    platform,
    version,
    workItems: workItemIds,
    createdBy: req.user._id,
  });

  const createdRelease = await release.save();

  // Update all associated workitems so they belong to this release
  // And maybe mark them as "In Review" or something if needed, 
  // though the prompt implies the Release itself tracks the review state.
  res.status(201).json(createdRelease);
});

// @desc    Get all Releases for a project
// @route   GET /api/releases/project/:projectId
// @access  Private
export const getReleasesForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const hasAccess = await hasProjectAccess(projectId, req.user._id, req.user.globalRole);
  if (!hasAccess) {
    res.status(403); throw new Error('Not authorized to access this project');
  }

  const releases = await Release.find({ projectId })
    .populate('createdBy', 'name avatar')
    .populate({
      path: 'workItems',
      select: 'title type priority status',
    })
    .sort({ createdAt: -1 });

  res.json(releases);
});

// @desc    Update a Release (e.g. Under Review -> Live)
// @route   PUT /api/releases/:id
// @access  Private
export const updateReleaseStatus = asyncHandler(async (req, res) => {
  const { status, version } = req.body;
  const release = await Release.findById(req.params.id);

  if (release) {
    const hasAccess = await hasProjectAccess(release.projectId, req.user._id, req.user.globalRole);
    if (!hasAccess) {
      res.status(403); throw new Error('Not authorized to update this release');
    }

    release.status = status || release.status;
    release.version = version !== undefined ? version : release.version;

    const updatedRelease = await release.save();
    res.json(updatedRelease);
  } else {
    res.status(404); throw new Error('Release not found');
  }
});
