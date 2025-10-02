import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as authController } from "./controllers/authentication.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server
const app = express();
app.set("port", process.env.PORT || 4000);

// Configuración
app.use(express.json());

// Servir archivos estáticos SOLO desde Public (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "Public")));

// ==================== RUTAS PÚBLICAS ====================

// Páginas HTML públicas
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
  res.sendFile(path.join(__dirname, "Pages", "sesion-publicados.html"));
});


// API de autenticación (públicas)
app.post("/api/login", authController.login);
app.post("/api/register", authController.register);

// ==================== RUTAS PROTEGIDAS ====================

// Ruta de prueba - solo usuarios autenticados
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario
  });
});

// Ruta solo para administradores
app.get("/api/admin/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  // Aquí podrías obtener todos los usuarios de la base de datos
  res.json({
    success: true,
    message: "Lista de usuarios (solo admin)"
  });
});

// Ruta para verificar token (útil para el frontend)
app.get("/api/verificar-token", verificarToken, (req, res) => {
  res.json({
    success: true,
    valido: true,
    usuario: req.usuario
  });
});

// Ruta para cerrar sesión (opcional - invalidar token del lado del cliente)
app.post("/api/logout", verificarToken, (req, res) => {
  // En JWT no hay forma de "invalidar" tokens del lado del servidor
  // La invalidación se hace eliminando el token del localStorage en el cliente
  res.json({
    success: true,
    message: "Sesión cerrada exitosamente"
  });
});

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor"
  });
});

// Iniciar servidor
app.listen(app.get("port"), () => {
  console.log(`✅ Servidor corriendo en http://localhost:${app.get("port")}`);
});
