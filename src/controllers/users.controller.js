import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export async function listUsers(req, res) {
  const users = await User.find().select("-passwordHash");
  res.json(users);
}

export async function createUser(req, res) {
  const { nombre, usuario, email, password, rol = "invitado", activo = true } = req.body || {};
  if (!nombre || !usuario || !email || !password) {
    return res.status(400).json({ error: "nombre, usuario, email y password son requeridos" });
  }
  const exists = await User.findOne({ $or: [{ usuario }, { email }] });
  if (exists) return res.status(409).json({ error: "usuario o email ya existe" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ nombre, usuario, email, passwordHash, rol, activo });
  res.status(201).json({ id: user._id, nombre, usuario, email, rol, activo });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { nombre, email, rol, activo, password } = req.body || {};
  const data = { nombre, email, rol, activo };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(id, data, { new: true }).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "Usuario no existe" });
  res.json(user);
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ ok: true });
}
