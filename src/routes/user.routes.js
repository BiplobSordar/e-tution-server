import express from "express";
import { getMyProfile, getUserProfileById, updateMyProfile, uploadAvatarToCloudinary } from "../controllers/user.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";


const router = express.Router();


router.get("/", checkAuth, getMyProfile);
router.get("/public/:id",  getUserProfileById);
router.put("/", checkAuth, updateMyProfile);
router.post("/avatar", checkAuth, uploadAvatarToCloudinary);


export default router;
