import Loan from "../models/loan.model.js";
import Item from "../models/item.model.js";

function computeStatus(loan) {
  const remaining = loan.prestado - loan.devuelto;
  if (remaining <= 0) return "COMPLETO";
  if (new Date(loan.fechaVence) < new Date()) return "VENCIDO";
  return "EN_CURSO";
}

export async function listLoans(req, res) {
  const loans = await Loan.find().populate("item").sort({ createdAt: -1 });
  for (const l of loans) {
    const status = computeStatus(l);
    if (l.estado !== status) { l.estado = status; await l.save(); }
  }
  res.json(loans);
}

export async function createLoan(req, res) {
  const { item: itemId, persona, prestado, fechaVence, observacion } = req.body || {};
  if (!itemId || !persona || !prestado || !fechaVence) {
    return res.status(400).json({ error: "item, persona, prestado y fechaVence son requeridos" });
  }
  const item = await Item.findById(itemId);
  if (!item) return res.status(404).json({ error: "Item no encontrado" });
  if (item.cantidad < prestado) return res.status(400).json({ error: "Stock insuficiente" });

  const loan = await Loan.create({ item: item._id, persona, prestado, fechaVence, observacion });
  // reduce stock
  item.cantidad -= prestado;
  await item.save();
  res.status(201).json(loan);
}

export async function returnLoan(req, res) {
  const { id } = req.params;
  const { cantidad = 0, observacion } = req.body || {};
  const loan = await Loan.findById(id);
  if (!loan) return res.status(404).json({ error: "Préstamo no encontrado" });
  const pending = loan.prestado - loan.devuelto;
  const toReturn = Math.min(cantidad, pending);
  loan.devuelto += toReturn;
  if (observacion) loan.observacion = (loan.observacion || "") + (loan.observacion ? " | " : "") + observacion;
  loan.estado = computeStatus(loan);
  await loan.save();

  // return to stock
  const item = await Item.findById(loan.item);
  item.cantidad += toReturn;
  await item.save();

  res.json(loan);
}

export async function deleteLoan(req, res) {
  const { id } = req.params;
  const loan = await Loan.findById(id);
  if (!loan) return res.status(404).json({ error: "Préstamo no encontrado" });
  // if not complete, revert stock of remaining not yet returned
  const pending = Math.max(loan.prestado - loan.devuelto, 0);
  if (pending > 0) {
    const item = await Item.findById(loan.item);
    item.cantidad += pending;
    await item.save();
  }
  await Loan.findByIdAndDelete(id);
  res.json({ ok: true });
}
