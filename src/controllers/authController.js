
import User from "../models/User.js"; 
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {
  try {
   
    const { uid, email } = req.firebaseUser;
    const { name, role, provider } = req.body;


    if (!email) return res.status(400).json({ message: "Email not provided" });


    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        uid,
        email,
        name,
        role: role || "student",
        provider: provider || "email",
      });
      await user.save();
    }



    return res.status(201).json({ status: 200, message: 'User Successfully Created.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};


export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
  
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  

    res.json({ accessToken, user });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};


export const googleLogin = async (req, res) => {
 
  try {
    const firebaseUser = req.firebaseUser;
    if (!firebaseUser) {
      return res.status(400).json({ message: "No Firebase user data received" });
    }

    const { uid, email, name } = firebaseUser;
    const { role, provider } = req.body || {};


    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({
        uid,
        email,
        name: name || "",
        role: role || "student",
        provider: provider || "google",
      });
      await user.save();
    }


    const accessToken = jwt.sign(
      { id: user._id, uid: user.uid, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" } 
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" } 
    );


res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

  
  
    res.json({
      success: true,
      user,
      accessToken,
      status: 200,
    });
  } catch (err) {
    console.error("Firebase login error:", err);
    res.status(500).json({ message: "Server error during Firebase login" });
  }
};



export const logout = async (req, res) => {
  try {
   
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

   
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};



export const login= async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser; 
    if (!firebaseUser) 
      return res.status(400).json({ message: "No Firebase user data" });

    const { uid, email } = firebaseUser;


    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(401).json({ message: "User does not exist. Please register first." });
    }

   
    const accessToken = jwt.sign(
      { id: user._id, uid: user.uid, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "5m" }
    );

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

   res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
    res.json({ success: true, user, accessToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};




