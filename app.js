import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as authController } from "./controllers/authentication.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";
import { methods as proyectosController } from "./controllers/proyectos.controller.js";
import { upload } from './middlewares/upload.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server
import { methods as publicacionController } from "./controllers/publications.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== CONFIGURACIÓN DEL SERVIDOR ====================

const app = express();
app.set("port", process.env.PORT || 4000);

// ✅ Middleware para procesar JSON y formularios HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <--- ✅ IMPORTANTE para leer datos enviados desde forms

// Servir archivos estáticos SOLO desde la carpeta Public (CSS, JS, imágenes)
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

app.get("/publicaciones", (req, res) => {
  // Página de publicaciones públicas
  res.sendFile(path.join(__dirname, "Pages", "sesion-publicados.html"));
});

app.get("/crear-publicacion", (req, res) => {
  // Página para crear publicación
  res.sendFile(path.join(__dirname, "Pages", "sesion-publicados.html"));
});

// ==================== API DE AUTENTICACIÓN ====================

// ✅ Registro e inicio de sesión
app.post("/api/register", authController.register);
app.post("/api/login", authController.login);

// ==================== RUTAS PROTEGIDAS ====================

// Perfil del usuario autenticado
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario
  });
});

// Solo para administradores
app.get("/api/admin/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  res.json({
    success: true,
    message: "Lista de usuarios (solo admin)"
  });
});

// Verificar validez del token
app.get("/api/verificar-token", verificarToken, (req, res) => {
  res.json({
    success: true,
    valido: true,
    usuario: req.usuario
  });
});

// Ruta para cerrar sesión (la invalidación real del token es del lado del cliente)
app.post("/api/logout", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Sesión cerrada exitosamente"
  });
});

// ==================== MANEJO DE ERRORES ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor"
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(app.get("port"), () => {
  console.log(`✅ Servidor corriendo en http://localhost:${app.get("port")}`);
});
});
