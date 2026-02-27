import express from "express";

const router = express.Router();
import { signup, login } from "../controller/user.js";
import protect from "../middleware.js/auth.js";
import { morningCheckin } from "../controller/genAi.js";

router.post("/signup", signup);
router.post("/login", login);
router.post("/morning-checkin", protect, morningCheckin);

export default router;
