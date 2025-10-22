import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as respuestasController } from "./controllers/respuestas.controller.js";
import { methods as authController } from "./controllers/authentication.controller.js";
import { methods as proyectosController } from "./controllers/proyectos.controller.js";
import { methods as publicacionController } from "./controllers/publications.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";
import { upload } from './middlewares/upload.js';



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

// Logout (no invalida token en servidor, solo responde OK)
app.post("/api/logout", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Sesión cerrada exitosamente"
  });
});

// ==================== RUTAS DE PUBLICACIONES ====================

app.get("/api/publicaciones", publicacionController.obtenerPublicaciones);
app.get("/api/publicaciones/:id", publicacionController.obtenerPublicacionPorId);
app.post("/api/publicaciones", verificarToken, publicacionController.crearPublicacion);
app.put("/api/publicaciones/:id", verificarToken, publicacionController.editarPublicacion);
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

<<<<<<< Updated upstream
=======
// ==================== RUTAS DE PUBLICACIONES ====================

// ✅ OBTENER TODAS LAS PUBLICACIONES (Pública - sin autenticación)
app.get("/api/publicaciones", publicacionController.obtenerPublicaciones);

// ✅ OBTENER UNA PUBLICACIÓN POR ID (Pública - sin autenticación)
app.get("/api/publicaciones/:id", publicacionController.obtenerPublicacionPorId);

// ✅ CREAR UNA NUEVA PUBLICACIÓN (Protegida - requiere autenticación)
app.post("/api/publicaciones", verificarToken, publicacionController.crearPublicacion);

// ✅ EDITAR UNA PUBLICACIÓN (Protegida - solo el autor)
app.put("/api/publicaciones/:id", verificarToken, publicacionController.editarPublicacion);

// ✅ ELIMINAR UNA PUBLICACIÓN (Protegida - solo el autor o administrador)
app.delete("/api/publicaciones/:id", verificarToken, publicacionController.eliminarPublicacion);

// ==================== MANEJO DE ERRORES ====================

// Ruta para manejar solicitudes a rutas no existentes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
});

//Favoritos
import favoritosRoutes from "./routes/favoritos.routes.js";
app.use("/api/favoritos", favoritosRoutes);


// Middleware global para manejo de errores del servidor
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor"
  });
});

>>>>>>> Stashed changes
// ==================== INICIAR SERVIDOR ====================
app.listen(app.get("port"), () => {
  console.log(`✅ Servidor corriendo en http://localhost:${app.get("port")}`);
});
// ...existing code...