import { Router } from "express";
import { authRequired, requireRole } from "../middlewares/auth.js";
import { listRequests, createRequest, updateRequestStatus, deleteRequest } from "../controllers/requests.controller.js";

const router = Router();

router.get("/", listRequests);
router.post("/", authRequired, requireRole("admin","encargado"), createRequest);
router.patch("/:id/status", authRequired, requireRole("admin","encargado"), updateRequestStatus);
router.delete("/:id", authRequired, requireRole("admin"), deleteRequest);

export default router;
