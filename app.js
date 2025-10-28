import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as respuestasController } from "./controllers/respuestas.controller.js";
import { methods as authController } from "./controllers/authentication.controller.js";
import { methods as proyectosController } from "./controllers/proyectos.controller.js";
import { methods as reportesController } from "./controllers/reportes.controller.js";
import { methods as publicacionController } from "./controllers/publications.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";
import { upload } from './middlewares/upload.js';
import favoritosRoutes from "./routes/favoritos.routes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inicializa la aplicación Express y configura el puerto
const app = express();
app.set("port", process.env.PORT || 4000);

// Middleware para parsear JSON en las solicitudes
app.use(express.json());

// Servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "Public")));

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'Public', 'uploads')));


// ==================== RUTAS DE REPORTES ====================

// Reportar un proyecto (requiere autenticación)
app.post("/api/proyectos/:id/reportar", verificarToken, reportesController.reportarProyecto);

// Reportar un comentario de proyecto (requiere autenticación)
app.post("/api/comentarios/:id/reportar", verificarToken, reportesController.reportarComentario);

// Obtener reportes (solo admin)
app.get("/api/reportes/publicaciones", verificarToken, verificarAdmin, reportesController.obtenerReportesPublicaciones);
app.get("/api/reportes/proyectos", verificarToken, verificarAdmin, reportesController.obtenerReportesProyectos);
app.get("/api/reportes/comentarios", verificarToken, verificarAdmin, reportesController.obtenerReportesComentarios);
app.get("/api/reportes/todos", verificarToken, verificarAdmin, reportesController.obtenerTodosLosReportes);


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
  const proyectoId = req.query.id;
  console.log("Abriendo proyecto ID:", proyectoId);
  res.sendFile(path.join(__dirname, "Pages", "Detalles_Proyecto.html"));
});

app.get("/crear-publicacion", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "sesion-publicados.html"));
});


// ==================== API PÚBLICA ====================

// Autenticación
app.post("/api/login", authController.login);
app.post("/api/register", authController.register);


// ==================== RUTAS DE PROYECTOS ====================

app.post("/api/proyectos/crear", upload.fields([
  { name: 'imagenes', maxCount: 5 },
  { name: 'documento_pdf', maxCount: 1 }
]), proyectosController.crearProyecto);

app.get("/api/proyectos", proyectosController.obtenerProyectos);
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

// Editar comentario
app.put("/api/comentarios/:id/editar", proyectosController.editarComentario);

// Eliminar comentario
app.delete("/api/comentarios/:id/eliminar", proyectosController.eliminarComentario);


// ==================== RUTAS DE PUBLICACIONES ====================

// Obtener todas las publicaciones (Pública)
app.get("/api/publicaciones", publicacionController.obtenerPublicaciones);

// Obtener una publicación por ID (Pública)
app.get("/api/publicaciones/:id", publicacionController.obtenerPublicacionPorId);

// Crear una nueva publicación (Protegida)
app.post("/api/publicaciones", verificarToken, publicacionController.crearPublicacion);

// Editar una publicación (Protegida)
app.put("/api/publicaciones/:id", verificarToken, publicacionController.editarPublicacion);

// Eliminar una publicación (Protegida)
app.delete("/api/publicaciones/:id", verificarToken, publicacionController.eliminarPublicacion);


// ==================== RUTAS DE RESPUESTAS ====================

// Obtener todas las respuestas de una publicación (público)
app.get("/api/publicaciones/:id/respuestas", respuestasController.obtenerRespuestas);

// Obtener el conteo de respuestas (público)
app.get("/api/publicaciones/:id/respuestas/contar", respuestasController.contarRespuestas);

// Crear una respuesta (requiere autenticación)
app.post("/api/publicaciones/:id/respuestas", verificarToken, respuestasController.crearRespuesta);

// Editar una respuesta (requiere autenticación)
app.put("/api/respuestas/:id", verificarToken, respuestasController.editarRespuesta);

// Eliminar una respuesta (requiere autenticación)
app.delete("/api/respuestas/:id", verificarToken, respuestasController.eliminarRespuesta);


// ==================== RUTAS DE FAVORITOS ====================

app.use("/api/favoritos", favoritosRoutes);


// ==================== RUTAS PROTEGIDAS ====================

// Perfil (requiere token)
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario
  });
});

// Solo administradores
app.get("/api/admin/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  res.json({
    success: true,
    message: "Lista de usuarios (solo admin)"
  });
});

// Verificar token (útil para frontend)
app.get("/api/verificar-token", verificarToken, (req, res) => {
  res.json({
    success: true,
    valido: true,
    usuario: req.usuario
  });
});

// Logout
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


// ==================== INICIAR SERVIDOR ====================

app.listen(app.get("port"), () => {
  console.log(`✅ Servidor corriendo en http://localhost:${app.get("port")}`);
});