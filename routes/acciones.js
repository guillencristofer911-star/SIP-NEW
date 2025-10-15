import express from "express";
import { eliminarPublicacion } from "../controllers/publicacionesController.js";
import { eliminarRespuesta } from "../controllers/respuestasController.js";

const router = express.Router();

// Ruta para eliminar publicación
router.delete("/publicacion", eliminarPublicacion);

// Ruta para eliminar respuesta
router.delete("/respuesta", eliminarRespuesta);

export default router;
