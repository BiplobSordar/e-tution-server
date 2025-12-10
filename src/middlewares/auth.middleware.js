import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const checkAuth = async (req, res, next) => {
  try {
    let token;

    // ✅ Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ✅ Fetch essential user data only
    const user = await User.findById(decoded.id).select(
      "_id uid email role"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Block inactive users
    if (["banned", "deleted", "restricted"].includes(user.status)) {
      return res.status(403).json({ message: "User access restricted" });
    }


    req.user = {
      id: user._id,
      uid: user.uid,
      email: user.email,
      role: user.role, 
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    res.status(500).json({ message: "Authentication failed" });
  }
};
