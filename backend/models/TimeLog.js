import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema(
  {
    workItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkItem',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hours: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true } // automatically gives us createdAt and updatedAt
);

const TimeLog = mongoose.model('TimeLog', timeLogSchema);
export default TimeLog;
