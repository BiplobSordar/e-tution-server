// routes/teacherRoutes.js
import express from "express";
import { getTeachers } from "../controllers/teacher.controller.js";

const router = express.Router();

// GET /api/teachers
router.get("/", getTeachers);

export default router;
