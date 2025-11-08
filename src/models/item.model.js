import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  descripcion: { type: String, required: true, trim: true },
  categoria: { type: String, default: "General" },
  cantidad: { type: Number, default: 0 },
  minimo: { type: Number, default: 0 },
  critico: { type: Number, default: 0 },
  responsable: { type: String, default: "Bodega" },
  observacion: { type: String, default: "" }
}, { timestamps: true });

itemSchema.virtual("estado").get(function () {
  if (this.cantidad <= this.critico) return "CRITICO";
  if (this.cantidad <= this.minimo) return "BAJO";
  return "OK";
});

itemSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Item", itemSchema);
