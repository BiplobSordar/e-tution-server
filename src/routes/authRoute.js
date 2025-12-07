
import express from "express";
import { registerUser, googleLogin,logout, login ,refreshAccessToken} from "../controllers/authController.js";
import { verifyFirebaseToken } from "../middlewares/verifyFirebaseToken.js";

const router = express.Router();

router.post("/register", verifyFirebaseToken, registerUser);
router.post("/firebase-login", verifyFirebaseToken, googleLogin);
router.post("/logout",logout);
router.post("/login",verifyFirebaseToken,login);
router.post("/refresh-token",refreshAccessToken);

export default router;
