import express from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { crearRespuesta } from "../controllers/respuestas.controller.js";

const router = express.Router();

router.post("/:idPublicacion", verificarToken, crearRespuesta);

export default router;
