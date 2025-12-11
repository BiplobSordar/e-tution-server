import express from "express";
import { createTuition } from "../controllers/tution.controller.js";
import { checkStudent } from "../middlewares/checkStudent.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", checkAuth, checkStudent, createTuition);

export default router;
