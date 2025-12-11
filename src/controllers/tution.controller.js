
import Tuition from "../models/Tutions.js";


export const createTuition = async (req, res) => {
  const postedBy=req.user.id
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
        console.log(proposal,'this is propossal')
        if (!proposal.role || !["student","guardian"].includes(proposal.role)) {
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
      scheduleProposals:scheduleProposals.map((proposal) => ({
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
