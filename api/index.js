import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import authRouter from "./routes/user.routes.js";
import genAiRouter from "./routes/genAi.routes.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", genAiRouter);

console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  // Scheduler removed — email chain is triggered by user replies in genAi.js
});
