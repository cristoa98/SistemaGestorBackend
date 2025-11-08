import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("[db] conectada:", config.mongoUri);
  } catch (err) {
    console.error("[db] error:", err.message);
    process.exit(1);
  }
}
