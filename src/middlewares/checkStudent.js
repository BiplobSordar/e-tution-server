
export const checkStudent = (req, res, next) => {
  const user = req.user;
  
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user.role !== "student") return res.status(403).json({ message: "Only students can create tuition" });

  next();
};
