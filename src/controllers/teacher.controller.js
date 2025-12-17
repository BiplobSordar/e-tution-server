
import mongoose from "mongoose";
import User from "../models/User.js";
import Tutions from "../models/Tutions.js";

export const getTeachers = async (req, res) => {
  try {
    let { page = 1, limit = 12, city, subject, minExperience, maxSalary } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {
      role: "teacher",
      status: "active",
    };

    if (city) query["tutorProfile.city"] = { $regex: city, $options: "i" };
    if (subject) query["tutorProfile.subjects"] = { $in: [subject] };
    if (minExperience) query["tutorProfile.experienceYears"] = { $gte: parseInt(minExperience) };
    if (maxSalary) query["tutorProfile.hourlyRate"] = { $lte: parseInt(maxSalary) };

    const total = await User.countDocuments(query);

    const teachers = await User.find(query)
      .select("_id name avatarUrl tutorProfile")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      teachers,
      count: total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getMyAppliedTuitions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher id",
      });
    }

 
    const tuitions = await Tutions.find({
      applications: {
        $elemMatch: { tutor: teacherId },
      },
      isActive: true,
    })
      .populate("postedBy", "name email avatarUrl")
      .populate("guardianPosted", "name email avatarUrl")
      .populate("assignedTutor", "name email avatarUrl")
      .select("-statusHistory")
      .lean();

 
    const formatted = tuitions.map((tuition) => {
      const myApplication = tuition.applications.find(
        (app) => app.tutor?.toString() === teacherId.toString()
      );

      return {
        _id: tuition._id,
        title: tuition.title,
        subjects: tuition.subjects,
        grade: tuition.grade,
        tuitionType: tuition.tuitionType,
        location: tuition.location,
        totalFee: tuition.totalFee,
        status: tuition.status,
        paymentStatus: tuition.paymentStatus,
        createdAt: tuition.createdAt,

        postedBy: tuition.postedBy,
        guardianPosted: tuition.guardianPosted || null,
        assignedTutor: tuition.assignedTutor || null,

        myApplication: myApplication
          ? {
            proposedRate: myApplication.proposedRate,
            message: myApplication.message,
            status: myApplication.status,
            appliedAt: myApplication.appliedAt,
          }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Get My Applications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



export const updateMyApplication = async (req, res) => {
  try {
    console.log('i am colling')
    const teacherId = req.user.id;
    const { tuitionId } = req.params;
    const { proposedRate, message } = req.body;
    console.log(proposedRate)
    console.log(message)
    console.log(tuitionId)
    console.log(teacherId)

    if (!mongoose.Types.ObjectId.isValid(tuitionId)) {
      return res.status(400).json({ message: "Invalid tuition id" });
    }

    const tuition = await Tutions.findOne({
      _id: tuitionId,
      status: "open",
      "applications.tutor": teacherId,
    });

    if (!tuition) {
      return res.status(404).json({
        message: "Application not found or tuition is no longer open",
      });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    const application = tuition.applications.find((app) =>
      app.tutor?.equals(teacherObjectId)
    );
    console.log(application)

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (proposedRate !== undefined) {
      application.proposedRate = proposedRate;
    }

    if (message !== undefined) {
      application.message = message;
    }

    await tuition.save();

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
    });
  } catch (error) {
    console.error("Update Application Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const withdrawMyApplication = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { tuitionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tuitionId)) {
      return res.status(400).json({ message: "Invalid tuition id" });
    }

    const result = await Tutions.findOneAndUpdate(
      {
        _id: tuitionId,
        status: "open",
        "applications.tutor": teacherId,
      },
      {
        $pull: {
          applications: { tutor: teacherId },
        },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        message:
          "Application not found or tuition is no longer open",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    console.error("Withdraw Application Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getMyOngoingTuitions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher id" });
    }

    const tuitions = await Tutions.find({
      assignedTutor: teacherId,
      status: { $in: ["assigned", "in-progress"] },
      isActive: true,
    })
      .populate("postedBy", "name email avatarUrl")
      .populate("guardianPosted", "name email avatarUrl")
      .populate("assignedTutor", "name email avatarUrl")
      .select("-applications -statusHistory")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: tuitions.length,
      data: tuitions,
    });
  } catch (error) {
    console.error("Get Ongoing Tuitions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};