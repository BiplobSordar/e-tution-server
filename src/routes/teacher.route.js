// routes/teacherRoutes.js
import express from "express";
import { getMyAppliedTuitions, getTeachers, updateMyApplication, withdrawMyApplication,getMyOngoingTuitions } from "../controllers/teacher.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { checkIsTeacher } from "../middlewares/checkIsTeacher.js";

const router = express.Router();

// GET /api/teachers
router.get("/", getTeachers);
router.get("/my-applications", checkAuth, checkIsTeacher, getMyAppliedTuitions);
router.patch("/applications/:tuitionId", checkAuth, checkIsTeacher, updateMyApplication);

router.delete("/applications/:tuitionId", checkAuth, checkIsTeacher, withdrawMyApplication);
router.get("/ongoing-tuitions",checkAuth, checkIsTeacher,getMyOngoingTuitions);


export default router;
