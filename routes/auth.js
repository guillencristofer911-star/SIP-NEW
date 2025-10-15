import express from "express";
import connection from "../config/db.js";
import { login, register, logout } from "../controllers/authController.js";

const router = express.Router();

// ✅ Ruta de prueba (puedes dejarla)
router.get("/test", (req, res) => {
  connection.query("SELECT * FROM estado_cuenta", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error en la consulta" });
    }
    res.json(results);
  });
});

// ✅ Ruta para registrar usuario
router.post("/register", register);

// ✅ Ruta para iniciar sesión
router.post("/login", login);

// ✅ Ruta para cerrar sesión
router.post("/logout", logout);

export default router;
