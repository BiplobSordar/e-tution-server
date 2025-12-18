
export const checkIsAdmin = (req, res, next) => {
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "admin") return res.status(403).json({ message: "Only Admin can access this route.." });

    next();
};
