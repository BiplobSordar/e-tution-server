import mongoose from "mongoose";


const TutorApplicationSchema = new mongoose.Schema({
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  proposedRate: {
    type: Number,
    required: true
  },
  message: String,
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });


const TuitionStatusHistorySchema = new mongoose.Schema({
  status: String,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });


const DaySlotSchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6 }, 
  subject: { type: String,  },
  from: { type: String, required: true },
  to: { type: String, required: true }
}, { _id: false });


const ScheduleProposalSchema = new mongoose.Schema({
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  role: {
    type: String,
    enum: ["student", "teacher"],
    required: true
  },
  schedule: [DaySlotSchema], 
  proposedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });


const FinalScheduleSchema = new mongoose.Schema({
  schedule: [DaySlotSchema] 
}, { _id: false });


const TuitionSchema = new mongoose.Schema({


  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  guardianPosted: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  grade: String,
  subjects: {
    type: [String],
    required: true
  },

  
  tuitionType: {
    type: String,
    enum: ["online", "offline", "hybrid"],
    required: true
  },
  location: {
    city: String,
    area: String,
    address: String
  },


  scheduleProposals: [ScheduleProposalSchema], 
  finalSchedule: FinalScheduleSchema,         


  totalFee: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },


  applications: [TutorApplicationSchema],
  assignedTutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },


  status: {
    type: String,
    enum: [
      "open",        
      "paid",       
      "assigned",   
      "in-progress",
      "completed",
      "cancelled"
    ],
    default: "open"
  },
  statusHistory: [TuitionStatusHistorySchema],


  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.model("Tuition", TuitionSchema);
