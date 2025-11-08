import { Router } from "express";
import { authRequired, requireRole } from "../middlewares/auth.js";
import { listUsers, createUser, updateUser, deleteUser } from "../controllers/users.controller.js";

const router = Router();

router.get("/", authRequired, requireRole("admin"), listUsers);
router.post("/", authRequired, requireRole("admin"), createUser);
router.put("/:id", authRequired, requireRole("admin"), updateUser);
router.delete("/:id", authRequired, requireRole("admin"), deleteUser);

export default router;
