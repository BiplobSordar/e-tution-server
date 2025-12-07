import admin from "../config/firebase.js";



export const verifyFirebaseToken = async (req, res, next) => {
 
  try {
    const authHeader = req.headers.authorization || "";

    const match = authHeader.match(/^Bearer (.*)$/);
    if (!match) return res.status(401).json({ message: "No token provided" });

    const idToken = match[1];
   
    
   
    const decoded = await admin.auth().verifyIdToken(idToken);
  
    req.firebaseUser = decoded;
    return next();
  } catch (err) {
    console.log(err)
    console.error("Firebase token verification failed:", err?.message || err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
