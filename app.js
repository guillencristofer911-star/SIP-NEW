import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as authController } from "./controllers/authentication.controller.js";
import { methods as proyectosController } from "./controllers/proyectos.controller.js";
import { methods as publicacionController } from "./controllers/publications.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";
import { upload } from "./middlewares/upload.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set("port", process.env.PORT || 4000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, "Public")));

// ==================== RUTAS PÚBLICAS ====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Login.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Registro.html"));
});

app.get("/configuracion", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Configuracion.html"));
});

// ==================== API DE AUTENTICACIÓN ====================
app.post("/api/register", authController.register);
app.post("/api/login", authController.login);

// ✅ Nueva ruta para cambiar contraseña
app.put("/api/change-password", verificarToken, authController.changePassword);

// ==================== RUTAS PROTEGIDAS ====================
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario,
  });
});

app.get("/api/admin/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  res.json({
    success: true,
    message: "Lista de usuarios (solo admin)",
  });
});

app.post("/api/logout", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Sesión cerrada exitosamente",
  });
});

// ==================== ERRORES ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

// ==================== SERVIDOR ====================
app.listen(app.get("port"), () => {
  console.log(`✅ Servidor corriendo en http://localhost:${app.get("port")}`);
});
