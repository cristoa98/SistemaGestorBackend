import bcrypt from "bcryptjs";
import { connectDB } from "../src/db.js";
import User from "../src/models/user.model.js";

await connectDB();

const adminUser = {
  nombre: "Administrador",
  usuario: "admin",
  email: "admin@local",
  passwordHash: await bcrypt.hash("admin123", 10),
  rol: "admin",
  activo: true,
};

const exists = await User.findOne({ usuario: adminUser.usuario });
if (exists) {
  console.log("Usuario admin ya existe.");
} else {
  await User.create(adminUser);
  console.log("Usuario admin creado: usuario=admin, password=admin123");
}

process.exit(0);
