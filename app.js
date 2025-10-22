// ...existing code...
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
const app = express();
app.set("port", process.env.PORT || 4000);

app.use(express.static('public'));


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, "Public")));
app.use('/uploads', express.static(path.join(__dirname, 'Public', 'uploads')));

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
  res.sendFile(path.join(__dirname, "Pages", "sesion-publicados.html"));
});
app.get("/feed-proyectos", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Feed_Proyectos.html"));
});
app.get("/crear-publicacion", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "sesion-publicados.html"));
});

// ==================== API PÚBLICA ====================
// Autenticación
app.post("/api/login", authController.login);
app.post("/api/register", authController.register);

// Proyectos (temporalmente públicas)
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

// ==================== RUTAS DE PUBLICACIONES ====================
app.get("/api/publicaciones", publicacionController.obtenerPublicaciones);
app.get("/api/publicaciones/:id", publicacionController.obtenerPublicacionPorId);
app.post("/api/publicaciones", verificarToken, publicacionController.crearPublicacion);
app.put("/api/publicaciones/:id", verificarToken, publicacionController.editarPublicacion);
app.delete("/api/publicaciones/:id", verificarToken, publicacionController.eliminarPublicacion);

// ==================== RUTAS DE RESPUESTAS ====================
app.get("/api/publicaciones/:id/respuestas", respuestasController.obtenerRespuestas);
app.get("/api/publicaciones/:id/respuestas/contar", respuestasController.contarRespuestas);
app.post("/api/publicaciones/:id/respuestas", verificarToken, respuestasController.crearRespuesta);
app.put("/api/respuestas/:id", verificarToken, respuestasController.editarRespuesta);
app.delete("/api/respuestas/:id", verificarToken, respuestasController.eliminarRespuesta);

// ==================== RUTAS DE REPORTES ====================
app.post("/api/publicaciones/:id/reportar", verificarToken, reportesController.reportarPublicacion);
app.get("/api/reportes", verificarToken, verificarAdmin, reportesController.obtenerReportes);


// ==================== RUTAS PROTEGIDAS ====================
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({ success: true, message: "Perfil de usuario", usuario: req.usuario });
});
app.get("/api/admin/usuarios", verificarToken, verificarAdmin, (req, res) => {
  res.json({ success: true, message: "Lista de usuarios (solo admin)" });
});
app.get("/api/verificar-token", verificarToken, (req, res) => {
  res.json({ success: true, valido: true, usuario: req.usuario });
});
app.post("/api/logout", verificarToken, (req, res) => {
  res.json({ success: true, message: "Sesión cerrada exitosamente" });
});

// ==================== PANEL DE ADMINISTRACIÓN ====================

app.get("/admin/panel", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Admin_Panel.html"));
});

// Favoritos (router separado)
app.use("/api/favoritos", favoritosRoutes);

// ==================== MANEJO DE ERRORES ====================
// 404 único
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" });
});

// Error handler único
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(app.get("port"), () => {
  console.log(`✅ Servidor corriendo en http://localhost:${app.get("port")}`);
});
// ...existing code...