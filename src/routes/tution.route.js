import express from "express";
import { createTuition, getAvailableTuitions, getMyTuitions, getTuitionById, deleteTuition,createCheckoutSession, stripeWebhook, getRecommendedTuitions, applyForTuition, getApplicationStatus, rejectTutorApplication, getPaidTuitionsWithPayment } from "../controllers/tution.controller.js";
import { checkStudent } from "../middlewares/checkStudent.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { checkIsTeacher } from "../middlewares/checkIsTeacher.js";

const router = express.Router();
router.get('/my-tutions', checkAuth, getMyTuitions);


router.get('/applications/check/:tuitionId', checkAuth, checkIsTeacher, getApplicationStatus)
router.post("/create", checkAuth, checkStudent, createTuition);
router.get("/paid-with-payment", checkAuth, checkStudent, getPaidTuitionsWithPayment);
router.get("/", getAvailableTuitions);
router.get("/recommended", getRecommendedTuitions);
router.post("/payments/create-checkout-session", checkAuth, createCheckoutSession);
router.post("/reject-tution", checkAuth, checkStudent, rejectTutorApplication);
router.post('/:tuitionId/apply', checkAuth, applyForTuition);
router.get("/:id", getTuitionById);
router.delete('/:id', checkAuth,checkStudent, deleteTuition);




export default router;
