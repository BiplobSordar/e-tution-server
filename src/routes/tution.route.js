import express from "express";
import { createTuition, getAvailableTuitions, getTuitionById, getRecommendedTuitions, applyToTuition } from "../controllers/tution.controller.js";
import { checkStudent } from "../middlewares/checkStudent.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { checkIsTeacher } from "../middlewares/checkIsTeacher.js";

const router = express.Router();
router.get("/:id", getTuitionById);
router.post("/:id/apply", checkAuth, checkIsTeacher, applyToTuition);
router.post("/create", checkAuth, checkStudent, createTuition);
router.get("/", getAvailableTuitions);
router.get("/recommended", getRecommendedTuitions);



export default router;
