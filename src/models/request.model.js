import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  tipo: { type: String, enum: ["prestamo", "devolucion", "baja"], required: true },
  persona: { type: String, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  cantidad: { type: Number, required: true },
  estado: { type: String, enum: ["pendiente", "aprobada", "rechazada", "completa"], default: "pendiente" },
  observacion: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Request", requestSchema);
