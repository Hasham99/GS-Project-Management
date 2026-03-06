import mongoose from 'mongoose';

const workItemSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    type: {
      type: String,
      enum: ['TASK', 'BUG', 'ISSUE', 'FEATURE', 'EPIC'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Backlog', 'Todo', 'InProgress', 'Review', 'Done', 'Blocked'],
      default: 'Backlog',
    },
    assignToAll: {
      type: Boolean,
      default: true,
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkItem',
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
    },
    dueDate: { type: Date },
    estimatedHours: { type: Number },
    storyPoints: { type: Number },
    labels: [{ type: String }],
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkItem',
      },
    ],
    environment: {
      type: String,
      enum: ['Dev', 'Staging', 'Prod', 'None'],
      default: 'None',
    },
  },
  { timestamps: true }
);

const WorkItem = mongoose.model('WorkItem', workItemSchema);
export default WorkItem;
