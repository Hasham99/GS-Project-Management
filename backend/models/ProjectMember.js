import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roleInProject: {
      type: String,
      enum: ['Manager', 'Developer', 'Viewer'],
      default: 'Viewer',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent adding the same user to the same project multiple times
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);
export default ProjectMember;
