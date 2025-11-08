import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { signToken } from "../middlewares/auth.js";

export async function login(req, res) {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) return res.status(400).json({ error: "usuario y password requeridos" });
  const user = await User.findOne({ usuario, activo: true });
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
  const token = signToken({ id: user._id, rol: user.rol, nombre: user.nombre, usuario: user.usuario });
  res.json({ token, user: { id: user._id, nombre: user.nombre, usuario: user.usuario, rol: user.rol, email: user.email } });
}
