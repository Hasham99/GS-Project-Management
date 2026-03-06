import mongoose from 'mongoose';

const releaseSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    platform: {
      type: String,
      enum: ['Apple', 'Android', 'Web'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Under Review', 'Live'],
      default: 'Under Review',
    },
    version: {
      type: String, // e.g., '1.0.5'
    },
    workItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkItem',
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Release = mongoose.model('Release', releaseSchema);
export default Release;
