
import mongoose from "mongoose";
import Tuition from "../models/Tutions.js";


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
    const userId = req.user?._id;
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
      .populate("applications.tutor", "name email");
  

    if (!tuition) {
      return res.status(404).json({ success: false, message: "Tuition not found" });
    }

    return res.status(200).json(tuition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const applyToTuition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const tuition = await Tuition.findById(id);

    if (!tuition) return res.status(404).json({ success: false, message: "Tuition not found" });


    const alreadyApplied = tuition.applications.some(app => app.tutor.toString() === userId.toString());
    if (alreadyApplied) return res.status(400).json({ success: false, message: "You have already applied" });

    tuition.applications.push({ tutor: userId, proposedRate: tuition.totalFee });
    await tuition.save();

    res.status(200).json({ success: true, message: "Applied successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getRecommendedTuitions = async (req, res) => {
  try {
    console.log("Recommended Tuition API Called");

    const { page = 1, limit = 10, city, grade, subject, tuitionType } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (isNaN(pageNumber) || isNaN(limitNumber)) {
      return res.status(400).json({ success: false, message: "Invalid page or limit" });
    }


    const baseFilter = { isActive: true, status: "open" };
G
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
