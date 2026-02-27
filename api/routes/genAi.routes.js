import express from "express";

import protect from "../middleware.js/auth.js";

import {
  morningCheckin,
  pollMessages,
  getChatContext,
} from "../controller/genAi.js";

const router = express.Router();

router.get("/chat/poll", protect, pollMessages);
router.post("/morning-checkin", protect, morningCheckin);
router.get("/chat/context", protect, getChatContext);

export default router;
