
import mongoose from "mongoose";
import Tuition from "../models/Tutions.js";
import User from "../models/User.js";
import stripe from "../config/stripe.js";


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


export const getMyTuitions = async (req, res) => {

  try {
    const userId = req.user.id;
    
    const tuitions = await Tuition.find({
      $or: [
        { postedBy: userId },
        { guardianPosted: userId }
      ]
    })
    .populate('postedBy', 'name email')
    .populate('guardianPosted', 'name email')
    .populate('assignedTutor', 'name email')
    .populate('applications.tutor', 'name email qualifications experience')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tuitions.length,
      tuitions
    });
  } catch (error) {
    console.error('Error fetching tuitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tuitions'
    });
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
       {
    $sort: { createdAt: -1 }
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


export const deleteTuition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const tuition = await Tuition.findById(id);
    if (!tuition) {
      return res.status(404).json({
        success: false,
        message: 'Tuition not found'
      });
    }


    if (tuition.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the tuition owner can delete this tuition'
      });
    }

 
    if (tuition.assignedTutor) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tuition that has an assigned tutor'
      });
    }

    if (tuition.paymentStatus !== 'unpaid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tuition that has been paid44'
      });
    }


    await Tuition.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Tuition deleted successfully'
    });
  } catch (error) {
    console.error('Delete tuition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tuition',
      error: error.message
    });
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
      role: 'teacher',
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



export const acceptTutorApplication = async (req, res) => {
  const { tuitionId, tutorId } = req.params;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tuition = await Tuition.findById(tuitionId).session(session);

    if (!tuition) {
      throw new Error("Tuition not found");
    }


    if (tuition.postedBy.toString() !== userId.toString()) {
      throw new Error("Unauthorized");
    }

    if (tuition.assignedTutor) {
      throw new Error("Tutor already assigned");
    }

    let found = false;

    tuition.applications.forEach((app) => {
      if (app.tutor.toString() === tutorId.toString()) {
        app.status = "accepted";
        found = true;
      } else {
        app.status = "rejected";
      }
    });

    if (!found) {
      throw new Error("Application not found");
    }

    tuition.assignedTutor = tutorId;
    tuition.status = "assigned";

    tuition.statusHistory.push({
      status: "assigned",
      changedBy: userId
    });

    await tuition.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Tutor accepted and assigned successfully"
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};





export const rejectTutorApplication = async (req, res) => {
  const { tuitionId, tutorId } = req.body
  console.log(tutorId,tutorId)
  const userId = req.user.id;

  try {
    const tuition = await Tuition.findById(tuitionId);
   

    if (!tuition) {
      return res.status(404).json({ message: "Tuition not found" });
    }


    if (tuition.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (tuition.assignedTutor) {
      return res.status(400).json({
        message: "Cannot reject application after tutor is assigned"
      });
    }

    const application = tuition.applications.find(
      (app) => app.tutor.toString() === tutorId.toString()
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        message: "Application already processed"
      });
    }

    application.status = "rejected";

    await tuition.save();

    res.status(200).json({
      success: true,
      message: "Application rejected successfully"
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const createCheckoutSession = async (req, res) => {
  const { tuitionId, tutorId } = req.body;
  const studentId = req.user.id;



  try {
    const tuition = await Tuition.findById(tuitionId);

    if (!tuition) {
      return res.status(404).json({ success: false, message: "Tuition not found" });
    }

 
    if (tuition.postedBy.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (tuition.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

  
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: tuition.title,
              description: `Tuition for grade ${tuition.grade} - Subjects: ${tuition.subjects.join(", ")}`,
            },
            unit_amount: tuition.totalFee * 100, 
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        tuitionId: tuition._id.toString(),
        tutorId: tutorId.toString(),
        studentId: studentId.toString(),
      },
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Stripe session creation failed" });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error(" Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }


  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const { tuitionId, tutorId } = session.metadata || {};

  if (!tuitionId || !tutorId) {
    return res.status(400).json({ message: "Missing metadata" });
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const tuition = await Tuition.findById(tuitionId).session(mongoSession);
    if (!tuition) throw new Error("Tuition not found");

    if (tuition.paymentStatus === "paid") {
      await mongoSession.commitTransaction();
      mongoSession.endSession();
      return res.status(200).json({ received: true });
    }


    let tutorFound = false;
    tuition.applications.forEach(app => {
      if (app.tutor.toString() === tutorId.toString()) {
        app.status = "accepted";
        tutorFound = true;
      } else {
        app.status = "rejected";
      }
    });

    if (!tutorFound) {
      throw new Error("Tutor application not found");
    }


    tuition.paymentStatus = "paid";
    tuition.paymentIntentId = session.payment_intent;
    tuition.paidAt = new Date();


    tuition.assignedTutor = tutorId;


    tuition.status = "in-progress";

    tuition.statusHistory.push({
      status: "in-progress",
      changedBy: tuition.postedBy
    });

    await tuition.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return res.status(200).json({ received: true });

  } catch (error) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    console.error(" Webhook error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};


export const getPaidTuitionsWithPayment = async (req, res) => {

  try {
    const userId = req.user.id;


    const paidTuitions = await Tuition.find({
      postedBy: userId,
      paymentStatus: "paid",
      paymentIntentId: { $exists: true, $ne: null }
    });

    
    const tuitionsWithPayment = await Promise.all(
      paidTuitions.map(async (tuition) => {
        const paymentIntent = await stripe.paymentIntents.retrieve(tuition.paymentIntentId);

        return {
          ...tuition.toObject(),
          payment: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null,
            created: paymentIntent.created
          }
        };
      })
    );

   
    res.json({
      success: true,
      count: tuitionsWithPayment.length,
      tuitions: tuitionsWithPayment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};






