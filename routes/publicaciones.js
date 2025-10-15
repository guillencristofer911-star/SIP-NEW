import express from "express";
import { eliminarPublicacion } from "../controllers/publicacionesController.js";
import { eliminarRespuesta } from "../controllers/respuestasController.js"; // 👈 corregido

const router = express.Router();

router.delete("/eliminar", eliminarPublicacion);
router.delete("/eliminar-respuesta", eliminarRespuesta);

export default router;

