import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as authController } from "./controllers/authentication.controller.js";
import { methods as proyectosController } from "./controllers/proyectos.controller.js";
import { methods as publicacionController } from "./controllers/publications.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";
import { upload } from './middlewares/upload.js';
<<<<<<< HEAD
=======
import favoritosRoutes from "./routes/favoritos.routes.js";
>>>>>>> parent of 7c1a78b (Configuracion y Cambiar Correo)

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

<<<<<<< HEAD
// ==================== RUTAS DE PERFIL ====================

// Actualizar correo del usuario
app.put("/api/perfil/correo", verificarToken, async (req, res) => {
  try {
    const { nuevoCorreo } = req.body;
    const usuarioId = req.usuario.id;

    // Validar que el correo no esté vacío
    if (!nuevoCorreo || nuevoCorreo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "El correo no puede estar vacío"
      });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoCorreo)) {
      return res.status(400).json({
        success: false,
        message: "El formato del correo no es válido"
      });
    }

    // Verificar si el correo ya existe en otro usuario
    const connection = await pool.getConnection();
    try {
      const [existingUsers] = await connection.execute(
        'SELECT ID_usuario FROM usuario WHERE correo = ? AND ID_usuario != ?',
        [nuevoCorreo, usuarioId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Este correo ya está en uso por otro usuario"
        });
      }

      // Actualizar el correo
      await connection.execute(
        'UPDATE usuario SET correo = ? WHERE ID_usuario = ?',
        [nuevoCorreo, usuarioId]
      );

      res.json({
        success: true,
        message: "Correo actualizado exitosamente",
        nuevoCorreo: nuevoCorreo
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Error al actualizar correo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al actualizar el correo"
    });
  }
});

=======
// ==================== RUTAS DE RESPUESTAS ====================
app.get("/api/publicaciones/:id/respuestas", respuestasController.obtenerRespuestas);
app.get("/api/publicaciones/:id/respuestas/contar", respuestasController.contarRespuestas);
app.post("/api/publicaciones/:id/respuestas", verificarToken, respuestasController.crearRespuesta);
app.put("/api/respuestas/:id", verificarToken, respuestasController.editarRespuesta);
app.delete("/api/respuestas/:id", verificarToken, respuestasController.eliminarRespuesta);

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

// Favoritos (router separado)
app.use("/api/favoritos", favoritosRoutes);

>>>>>>> parent of 7c1a78b (Configuracion y Cambiar Correo)
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
// ...existing code...