import Request from "../models/request.model.js";

export async function listRequests(req, res) {
  const q = {};
  if (req.query.tipo) q.tipo = req.query.tipo;
  if (req.query.estado) q.estado = req.query.estado;
  const rows = await Request.find(q).populate("item").sort({ createdAt: -1 });
  res.json(rows);
}

export async function createRequest(req, res) {
  const { tipo, persona, item, cantidad, observacion } = req.body || {};
  if (!tipo || !persona || !item || !cantidad) {
    return res.status(400).json({ error: "tipo, persona, item y cantidad son requeridos" });
  }
  const row = await Request.create({ tipo, persona, item, cantidad, observacion });
  res.status(201).json(row);
}

export async function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { estado } = req.body || {};
  if (!estado) return res.status(400).json({ error: "estado requerido" });
  const row = await Request.findByIdAndUpdate(id, { estado }, { new: true });
  if (!row) return res.status(404).json({ error: "Solicitud no encontrada" });
  res.json(row);
}

export async function deleteRequest(req, res) {
  await Request.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}
