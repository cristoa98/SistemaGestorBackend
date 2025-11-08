import { Router } from "express";
import { authRequired, requireRole } from "../middlewares/auth.js";
import { listLoans, createLoan, returnLoan, deleteLoan } from "../controllers/loans.controller.js";

const router = Router();

router.get("/", listLoans);
router.post("/", authRequired, requireRole("admin","encargado"), createLoan);
router.patch("/:id/return", authRequired, requireRole("admin","encargado"), returnLoan);
router.delete("/:id", authRequired, requireRole("admin"), deleteLoan);

export default router;
