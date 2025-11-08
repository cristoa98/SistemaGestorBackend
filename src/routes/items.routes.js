import { Router } from "express";
import { authRequired, requireRole } from "../middlewares/auth.js";
import { listItems, getItem, createItem, updateItem, deleteItem } from "../controllers/items.controller.js";

const router = Router();

router.get("/", listItems);
router.get("/:id", getItem);
router.post("/", authRequired, requireRole("admin","encargado"), createItem);
router.put("/:id", authRequired, requireRole("admin","encargado"), updateItem);
router.delete("/:id", authRequired, requireRole("admin"), deleteItem);

export default router;
