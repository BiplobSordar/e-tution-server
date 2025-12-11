
export const checkIsTeacher = (req, res, next) => {
  const user = req.user;
  
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user.role !== "teacher") return res.status(403).json({ message: "Only Teacher can access this route.." });

  next();
};
