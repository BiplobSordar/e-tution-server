
import mongoose from "mongoose";





const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  reason: { type: String, default: "" },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  changedAt: { type: Date, default: Date.now }
}, { _id: false });




const GuardianRefSchema = new mongoose.Schema({
  guardianId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  relation: { type: String },
  canViewProgress: { type: Boolean, default: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });



const TutorProfileSchema = new mongoose.Schema({
  subjects: [String],
  hourlyRate: Number,
  experienceYears: Number,
  documents: [String],
  availability: [{
    day: Number,
    from: String,
    to: String
  }]
}, { _id: false });



const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, index: true },

  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String },
  phone: String,
  avatarUrl: String,


  role: { type: String, enum: ["student", "tutor", "guardian", "admin"], required: true, default: "student" },
  tutorProfile: TutorProfileSchema,
  guardianOf: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  guardians: [GuardianRefSchema],


  status: { type: String, enum: ["pending", "active", "suspended", "restricted", "banned", "deleted"], default: "pending", index: true },
  statusHistory: [StatusHistorySchema],






  createdAt: { type: Date, default: Date.now, index: true },

}, { timestamps: true });






export default mongoose.model("User", UserSchema);
