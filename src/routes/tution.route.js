import express from "express";
import { createTuition,getAvailableTuitions } from "../controllers/tution.controller.js";
import { checkStudent } from "../middlewares/checkStudent.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", checkAuth, checkStudent, createTuition);
router.get("/", getAvailableTuitions);

export default router;
