import express from "express";
import {
    getAllUsers, updateUser, deleteUser, getTuitions,
    approveTuition,
    rejectTuition,
    updateTuitionStatus,
    getTuitionById,
    deleteTuition,
      getSimpleRevenue,
  getSimpleTransactions,
  getRevenueTrend,
  exportRevenueReport
} from "../controllers/admin.Controller.js";

import { checkAuth } from "../middlewares/auth.middleware.js";
import { checkIsAdmin } from "../middlewares/checkIsAdmin.js";

const router = express.Router();




router.get("/users", checkAuth, checkIsAdmin, getAllUsers);
router.patch("/users/:id", checkAuth, checkIsAdmin, updateUser);
router.delete("/users/:id", checkAuth, checkIsAdmin, deleteUser);






router.use(checkAuth);
router.use(checkIsAdmin);


router.route("/tutions").get(getTuitions);


router.route("/tutions/:id").get(getTuitionById);


router.route("/tutions/:id/approve").put(approveTuition);


router.route("/tutions/:id/reject").put(rejectTuition);


router.route("/tutions/:id/status").put(updateTuitionStatus);


router.route("/tutions/:id").delete(deleteTuition);
router.get('/revenue', getSimpleRevenue);
router.get('/transactions', getSimpleTransactions);
router.get('/revenue-trend', getRevenueTrend);
router.post('/export', exportRevenueReport);


export default router;
