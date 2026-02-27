import dotenv from "dotenv";
dotenv.config();

import express from "express";
import authRouter from "./routes/user.routes.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json()); // don't forget this or req.body will be undefined
app.use("/api/v1/auth", authRouter);

console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
