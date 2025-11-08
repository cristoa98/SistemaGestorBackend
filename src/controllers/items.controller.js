import Item from "../models/item.model.js";

export async function listItems(req, res) {
  const q = {};
  if (req.query.categoria) q.categoria = req.query.categoria;
  const items = await Item.find(q).sort({ createdAt: -1 });
  res.json(items);
}

export async function getItem(req, res) {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "No encontrado" });
  res.json(item);
}

export async function createItem(req, res) {
  const { descripcion, categoria, cantidad = 0, minimo = 0, critico = 0, responsable, observacion } = req.body || {};
  if (!descripcion) return res.status(400).json({ error: "descripcion requerida" });
  const item = await Item.create({ descripcion, categoria, cantidad, minimo, critico, responsable, observacion });
  res.status(201).json(item);
}

export async function updateItem(req, res) {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ error: "No encontrado" });
  res.json(item);
}

export async function deleteItem(req, res) {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}
