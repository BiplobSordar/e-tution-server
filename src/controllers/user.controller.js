import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import mongoose from "mongoose";



export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId)

      .populate("guardians.guardianId", "name email role avatarUrl")

      .populate("guardianOf", "name email role avatarUrl")

      .populate("guardianProfile.studentsUnderCare", "name email role avatarUrl")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get my profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};







export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
   

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }


    const blockedFields = [
      "email",
      "password",
      "uid",
      "role",
      "status",
      "statusHistory",
      "createdAt",
      "guardians",
      "guardianOf",
    ];

    blockedFields.forEach((field) => delete req.body[field]);


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate("guardians.guardianId", "name email role avatarUrl")
      .populate("guardianOf", "name email role avatarUrl")
      .populate("guardianProfile.studentsUnderCare", "name email role avatarUrl");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
   
  } catch (error) {
    console.error("Update my profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const uploadAvatarToCloudinary = async (req, res) => {
  try {
    const { avatarBase64 } = req.body;
    const userId = req.user.id;

    if (!avatarBase64) {
      return res.status(400).json({ message: "No avatar provided" });
    }


    const base64Length = avatarBase64.length * (3 / 4);
    if (base64Length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Image size exceeds 5MB" });
    }


    const uploadResponse = await cloudinary.v2.uploader.upload(avatarBase64, {
      folder: "e-tutltio/user-profile-image",
      public_id: `user_${userId}_${Date.now()}`,
      overwrite: true,
    });

 
    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: uploadResponse.secure_url,
      user,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
};