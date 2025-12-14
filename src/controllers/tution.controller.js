
import mongoose from "mongoose";
import Tuition from "../models/Tutions.js";
import User from "../models/User.js";


export const createTuition = async (req, res) => {
  const postedBy = req.user.id
  try {
    const {

      guardianPosted,
      title,
      description,
      grade,
      subjects,
      tuitionType,
      location,
      totalFee,
      scheduleProposals
    } = req.body;
    console.log(postedBy)


    if (!postedBy) return res.status(400).json({ message: "postedBy is required" });
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!description) return res.status(400).json({ message: "Description is required" });
    if (!grade) return res.status(400).json({ message: "Grade is required" });
    if (!subjects || subjects.length === 0)
      return res.status(400).json({ message: "At least one subject is required" });
    if (!tuitionType || !["online", "offline", "hybrid"].includes(tuitionType))
      return res.status(400).json({ message: "Invalid tuition type" });
    if (!totalFee || totalFee < 0) return res.status(400).json({ message: "Total fee is required" });


    if (["offline", "hybrid"].includes(tuitionType)) {
      if (!location || !location.city || !location.area || !location.address) {
        return res.status(400).json({ message: "Complete location is required for offline/hybrid tuition" });
      }
    }


    if (scheduleProposals && scheduleProposals.length > 0) {
      scheduleProposals.forEach((proposal) => {
        console.log(proposal, 'this is propossal')
        if (!proposal.role || !["student", "guardian"].includes(proposal.role)) {
          throw new Error("Invalid role in schedule proposal");
        }

        proposal.schedule.forEach((slot) => {
          if (slot.day === undefined || !slot.from || !slot.to) {

            throw new Error("Invalid schedule slot");
          }
        });
      });
    }


    const tuition = await Tuition.create({
      postedBy,
      guardianPosted,
      title,
      description,
      grade,
      subjects,
      tuitionType,
      location,
      totalFee,
      scheduleProposals: scheduleProposals.map((proposal) => ({
        ...proposal,
        proposedBy: postedBy,
      })),
    });

    res.status(201).json({
      message: "Tuition created successfully",
      tuition
    });
  } catch (error) {
    console.error("Error creating tuition:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};





export const getAvailableTuitions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, city, grade, subject, tuitionType } = req.query;

    const skip = (page - 1) * limit;


    const cityLower = city?.toLowerCase();
    const gradeLower = grade?.toLowerCase();
    const subjectLower = subject?.toLowerCase();
    const typeLower = tuitionType?.toLowerCase();


    const baseMatch = {
      isActive: true,
      status: "open",
    };

    const pipeline = [
      { $match: baseMatch },


      {
        $match: {
          $and: [
            cityLower
              ? { $expr: { $eq: [{ $toLower: "$location.city" }, cityLower] } }
              : {},
            gradeLower
              ? { $expr: { $eq: [{ $toLower: "$grade" }, gradeLower] } }
              : {},
            typeLower
              ? { $expr: { $eq: [{ $toLower: "$tuitionType" }, typeLower] } }
              : {},
            subjectLower
              ? { $expr: { $in: [subjectLower, { $map: { input: "$subjects", as: "sub", in: { $toLower: "$$sub" } } }] } }
              : {},
          ]
        }
      },


      {
        $addFields: {
          alreadyApplied: userId
            ? {
              $in: [
                new mongoose.Types.ObjectId(userId),
                "$applications.tutor"
              ]
            }
            : false
        }
      },


      {
        $project: {
          statusHistory: 0,
          applications: 0,
          scheduleProposals: 0,
          finalSchedule: 0,
        }
      },

      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const tuitions = await Tuition.aggregate(pipeline);
    const total = await Tuition.countDocuments(baseMatch);

    return res.status(200).json({
      success: true,
      message: "Tuitions fetched successfully",
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
      tuitions,
    });

  } catch (error) {
    console.error("Get Available Tuitions Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};





export const getTuitionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Tuition ID" });
    }

    const tuition = await Tuition.findById(id)
      .populate("postedBy", "name email")
      .populate("guardianPosted", "name email")
      .populate("applications.tutor", "name email")






    if (!tuition) {
      return res.status(404).json({ success: false, message: "Tuition not found" });
    }

    return res.status(200).json(tuition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getApplicationStatus = async (req, res) => {
  try {
    const { tuitionId } = req.params;
    const userId = req.user.id;


    if (!mongoose.Types.ObjectId.isValid(tuitionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tuition ID'
      });
    }


    const tuition = await Tuition.findById(tuitionId)
      .select('applications status');

    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: 'Tuition not found'
      });
    }

  
    const userApplication = tuition.applications.find(app =>
      app.tutor.toString() === userId.toString()
    );

   
    const isAssignedTutor =
      tuition &&
      tuition.assignedTutor &&
      tuition.assignedTutor.toString() === userId.toString();

    res.status(200).json({
      success: true,
      data: {
        hasApplied: !!userApplication,
        application: userApplication || null,
        isAssignedTutor,
        tuitionStatus: tuition.status,
        totalApplications: tuition.applications.length
      }
    });

  } catch (error) {
    console.error('Error getting application status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application status'
    });
  }
};



export const applyForTuition = async (req, res) => {
  try {
    const { tuitionId } = req.params;
    const userId = req.user.id;


    const {
      proposedRate,
      message,
      scheduleProposal
    } = req.body;

   

    if (!proposedRate || isNaN(proposedRate) || proposedRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid proposed rate is required'
      });
    }

    if (!scheduleProposal?.schedule || !Array.isArray(scheduleProposal.schedule)) {
      return res.status(400).json({
        success: false,
        message: 'Schedule proposal with schedule array is required'
      });
    }


    for (const slot of scheduleProposal.schedule) {
      if (slot.day === undefined || slot.day < 0 || slot.day > 6) {
        return res.status(400).json({
          success: false,
          message: `Invalid day value (${slot.day}). Day must be between 0-6`
        });
      }

      if (!slot.from || !slot.to) {
        return res.status(400).json({
          success: false,
          message: 'Each schedule slot must have from and to times'
        });
      }

    
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.from) || !timeRegex.test(slot.to)) {
        return res.status(400).json({
          success: false,
          message: 'Time must be in HH:mm format (24-hour)'
        });
      }

    
      const fromTime = new Date(`2000-01-01T${slot.from}:00`);
      const toTime = new Date(`2000-01-01T${slot.to}:00`);
      if (fromTime >= toTime) {
        return res.status(400).json({
          success: false,
          message: `Start time (${slot.from}) must be before end time (${slot.to})`
        });
      }
    }

   
   
    const teacher = await User.findById(userId);
  
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can apply for tuitions'
      });
    }

    if (teacher.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact support.'
      });
    }

  
    if (!mongoose.Types.ObjectId.isValid(tuitionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tuition ID format'
      });
    }


    const tuition = await Tuition.findById(tuitionId)
      .populate('postedBy', 'name email')
      .populate('guardianPosted', 'name email');

    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: 'Tuition not found'
      });
    }


    if (tuition.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `This tuition is ${tuition.status}. Applications are not being accepted.`
      });
    }

  
    const alreadyApplied = tuition.applications.some(app =>
      app.tutor.toString() === userId.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this tuition'
      });
    }

  
    const teacherSubjects = teacher.tutorProfile?.subjects || [];
    const tuitionSubjects = tuition.subjects || [];

    const hasMatchingSubjects = teacherSubjects.some(subject =>
      tuitionSubjects.includes(subject)
    );

    if (!hasMatchingSubjects) {
      return res.status(400).json({
        success: false,
        message: 'Your subjects do not match the tuition requirements',
        teacherSubjects,
        tuitionSubjects
      });
    }

  
    const tutorApplication = {
      tutor: userId,
      proposedRate: parseFloat(proposedRate),
      message: message || '',
      status: 'pending',
      appliedAt: new Date()
    };

   
    const scheduleProposalData = {
      proposedBy: userId,
      role: 'tutor',
      schedule: scheduleProposal.schedule.map(slot => ({
        day: slot.day,
        subject: slot.subject || tuitionSubjects[0], 
        from: slot.from,
        to: slot.to
      })),
      proposedAt: new Date()
    };

    const session = await mongoose.startSession();
    session.startTransaction();



    try {
    
      const updatedTuition = await Tuition.findByIdAndUpdate(
        tuitionId,
        {
          $push: {
            applications: tutorApplication,
            scheduleProposals: scheduleProposalData
          },
          $addToSet: {
            statusHistory: {
              status: 'open',
              changedBy: userId,
              changedAt: new Date(),
              reason: 'New application received'
            }
          }
        },
        {
          new: true,
          session,
          select: '-__v -updatedAt'
        }
      ).populate({
        path: 'applications.tutor',
        select: 'name email avatarUrl tutorProfile'
      });

  
      await User.findByIdAndUpdate(
        userId,
        {
          $inc: { 'tutorProfile.totalApplications': 1 }
        },
        { session }
      );



  await session.commitTransaction();
      session.endSession();


      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
      });

    } catch (transactionError) {
    
      await session.abortTransaction();
      session.endSession();

      throw transactionError;
    }

  } catch (error) {
    console.error('Error applying for tuition:', error);

 
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format'
      });
    }

   
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



export const getRecommendedTuitions = async (req, res) => {
  try {


    const { page = 1, limit = 10, city, grade, subject, tuitionType } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (isNaN(pageNumber) || isNaN(limitNumber)) {
      return res.status(400).json({ success: false, message: "Invalid page or limit" });
    }


    const baseFilter = { isActive: true, status: "open" };

    const orConditions = [];

    if (city) {
      orConditions.push({
        "location.city": { $regex: city, $options: "i" }
      });
    }

    if (grade) {
      orConditions.push({
        grade: { $regex: grade, $options: "i" }
      });
    }

    if (subject) {
      orConditions.push({
        subject: { $regex: subject, $options: "i" }
      });
    }

    if (tuitionType) {
      orConditions.push({
        tuitionType: { $regex: tuitionType, $options: "i" }
      });
    }


    let finalQuery = { ...baseFilter };


    if (orConditions.length > 0) {
      finalQuery.$or = orConditions;
    }



    const skip = (pageNumber - 1) * limitNumber;


    const tuitions = await Tuition.find(finalQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .select("-applications -statusHistory -scheduleProposals -finalSchedule");

    const total = await Tuition.countDocuments(finalQuery);

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      count: tuitions.length,
      data: tuitions,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
