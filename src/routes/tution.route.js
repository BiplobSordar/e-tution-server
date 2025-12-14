import express from "express";
import { createTuition, getAvailableTuitions, getTuitionById, getRecommendedTuitions, applyForTuition, getApplicationStatus } from "../controllers/tution.controller.js";
import { checkStudent } from "../middlewares/checkStudent.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { checkIsTeacher } from "../middlewares/checkIsTeacher.js";

const router = express.Router();
router.get("/:id", getTuitionById);
router.post('/:tuitionId/apply', checkAuth, applyForTuition);
router.get('/applications/check/:tuitionId', checkAuth, checkIsTeacher, getApplicationStatus)
router.post("/create", checkAuth, checkStudent, createTuition);
router.get("/", getAvailableTuitions);
router.get("/recommended", getRecommendedTuitions);




export default router;
