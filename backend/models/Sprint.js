import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    goal: { type: String },
    status: {
      type: String,
      enum: ['Planned', 'Active', 'Completed'],
      default: 'Planned',
    },
  },
  { timestamps: true }
);

const Sprint = mongoose.model('Sprint', sprintSchema);
export default Sprint;
