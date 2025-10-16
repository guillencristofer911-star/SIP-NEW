import express from "express";
import { obtenerNotificaciones, marcarComoLeida } from "../controllers/notificaciones.controller.js";
import { verificarToken } from "../middlewares/authMiddleware.js";
import { crearNotificacion } from "./notificaciones.controller.js";

const router = express.Router();

// ✅ Obtener todas las notificaciones del usuario logueado
router.get("/", verificarToken, obtenerNotificaciones);

// ✅ Marcar una notificación como leída
router.put("/:id/leida", verificarToken, marcarComoLeida);

export default router;
