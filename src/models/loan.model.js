import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  persona: { type: String, required: true },
  prestado: { type: Number, required: true },
  devuelto: { type: Number, default: 0 },
  fechaEntrega: { type: Date, default: Date.now },
  fechaVence: { type: Date, required: true },
  observacion: { type: String, default: "" },
  estado: { type: String, enum: ["EN_CURSO", "VENCIDO", "COMPLETO"], default: "EN_CURSO" }
}, { timestamps: true });

export default mongoose.model("Loan", loanSchema);
