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
const app = express();
app.set("port", process.env.PORT || 4000);

// Configuración
app.use(express.json());

// Servir archivos estáticos SOLO desde Public (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "Public")));

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'Public', 'uploads')));

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

app.get("/feed-proyectos", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Feed_Proyectos.html"));
});

app.get("/Detalles_Proyecto.html", (req, res) => {
  const proyectoId = req.query.id; // Captura el ID del URL
  console.log("Abriendo proyecto ID:", proyectoId);
  res.sendFile(path.join(__dirname, "Pages", "Detalles_Proyecto.html"));
});

// API de autenticación (públicas)
app.post("/api/login", authController.login);
app.post("/api/register", authController.register);

// ==================== RUTAS DE PROYECTOS (PÚBLICAS TEMPORALMENTE) ====================

// RUTAS DE PROYECTOS EXISTENTES
app.post("/api/proyectos/crear", upload.fields([
    { name: 'imagenes', maxCount: 5 },
    { name: 'documento_pdf', maxCount: 1 }
]), proyectosController.crearProyecto);

app.get("/api/proyectos", proyectosController.obtenerProyectos);

// NUEVAS RUTAS PARA EDITAR Y ELIMINAR PROYECTOS
app.get("/api/proyectos/:id", proyectosController.obtenerProyectoPorId);
app.put("/api/proyectos/:id/editar", upload.fields([
    { name: 'imagenes', maxCount: 5 },
    { name: 'documento_pdf', maxCount: 1 }
]), proyectosController.editarProyecto);
app.delete("/api/proyectos/:id/eliminar", proyectosController.eliminarProyecto);

// ==================== RUTAS DE COMENTARIOS ====================

// Obtener comentarios de un proyecto
app.get("/api/proyectos/:id/comentarios", proyectosController.obtenerComentariosProyecto);

// Crear nuevo comentario
app.post("/api/proyectos/:id/comentarios", proyectosController.crearComentario);

// EDITAR comentario (FALTABA ESTA RUTA)
app.put("/api/comentarios/:id/editar", proyectosController.editarComentario);

// ELIMINAR comentario (FALTABA ESTA RUTA)
app.delete("/api/comentarios/:id/eliminar", proyectosController.eliminarComentario);
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

// Ruta para cerrar sesión
app.post("/api/logout", verificarToken, (req, res) => {
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