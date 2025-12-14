import mongoose from "mongoose";


const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    reason: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);


const GuardianRefSchema = new mongoose.Schema(
  {
    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    relation: String,
    canViewProgress: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const TutorProfileSchema = new mongoose.Schema(
  {
    subjects: [String],
    hourlyRate: Number,
    experienceYears: Number,
    documents: [String],
    availability: [
      {
        day: { type: Number, min: 0, max: 6 },
        from: String,
        to: String
      }
    ],
    bio: { type: String, default: "" },
    qualifications: [String],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  { _id: false }
);


const StudentProfileSchema = new mongoose.Schema(
  {
    grade: String,
    school: String,
    subjectsInterested: [String],
    learningGoals: [String],
    guardianContact: String
  },
  { _id: false }
);


const GuardianProfileSchema = new mongoose.Schema(
  {
    occupation: String,
    emergencyContact: String,
    studentsUnderCare: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { _id: false }
);


const AdminProfileSchema = new mongoose.Schema(
  {
    department: String,
    lastLogin: Date
  },
  { _id: false }
);


const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    password: { type: String },
    phone: String,
    avatarUrl: String,

    role: {
      type: String,
      enum: ["student", "teacher", "guardian", "admin"],
      required: true,
      default: "student"
    },

    tutorProfile: TutorProfileSchema,
    studentProfile: StudentProfileSchema,
    guardianProfile: GuardianProfileSchema,
    adminProfile: AdminProfileSchema,

    guardianOf: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    guardians: [GuardianRefSchema],

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "suspended",
        "restricted",
        "banned",
        "deleted"
      ],
      default: "pending",
      index: true
    },
    statusHistory: [StatusHistorySchema],

    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },

    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);


UserSchema.virtual("profileCompletion").get(function () {
  let total = 0;
  let completed = 0;

  const check = (value) => {
    total++;
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      completed++;
    }
  };


  check(this.name);
  check(this.email);
  check(this.phone);
  check(this.avatarUrl);


  if (this.role === "student" && this.studentProfile) {
    check(this.studentProfile.grade);
    check(this.studentProfile.school);
    check(this.studentProfile.subjectsInterested);
  }

  if (this.role === "teacher" && this.tutorProfile) {
    check(this.tutorProfile.subjects);
    check(this.tutorProfile.hourlyRate);
    check(this.tutorProfile.experienceYears);
    check(this.tutorProfile.availability);
    check(this.tutorProfile.bio);
  }

  if (this.role === "guardian" && this.guardianProfile) {
    check(this.guardianProfile.emergencyContact);
    check(this.guardianProfile.studentsUnderCare);
  }

  if (this.role === "admin" && this.adminProfile) {
    check(this.adminProfile.department);
  }

  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percentage,
    isComplete: percentage >= 80
  };
});


UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export default mongoose.model("User", UserSchema);
