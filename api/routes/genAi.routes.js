import express from "express";
import { pollMessages } from "../controller/genAi.js";
import protect from "../middleware.js/auth.js";
import { morningCheckin } from "../controller/genAi.js";

const router = express.Router();

router.get("/chat/poll", protect, pollMessages);
router.post("/morning-checkin", protect, morningCheckin);

export default router;
