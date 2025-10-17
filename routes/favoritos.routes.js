import { Router } from "express";
import { methods as favoritosController } from "../controllers/favoritos.controller.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = Router();

// ✅ Rutas protegidas con token
router.post("/agregar", verificarToken, favoritosController.agregarFavorito);
router.get("/:ID_usuario", verificarToken, favoritosController.obtenerFavoritos);
router.delete("/eliminar", verificarToken, favoritosController.eliminarFavorito);

export default router;