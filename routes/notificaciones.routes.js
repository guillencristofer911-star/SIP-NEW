import { Router } from "express";
import {
  obtenerNotificaciones,
  marcarComoLeida,
  eliminarNotificacion,
} from "../controllers/notificaciones.controller.js";

const router = Router();

// ✅ Obtener todas las notificaciones del usuario
router.get("/:idUsuario", obtenerNotificaciones);

// ✅ Marcar como leída
router.put("/leer/:id", marcarComoLeida);

// ✅ Eliminar notificación
router.delete("/:id", eliminarNotificacion);

export default router;
