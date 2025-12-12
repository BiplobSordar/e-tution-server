
import User from "../models/User.js";

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