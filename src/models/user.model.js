import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  usuario: { type: String, required: true, trim: true, unique: true },
  email: { type: String, required: true, trim: true, unique: true },
  passwordHash: { type: String, required: true },
  rol: { type: String, enum: ["admin", "encargado", "invitado"], default: "invitado" },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
