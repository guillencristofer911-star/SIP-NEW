import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as authController } from "./controllers/authentication.controller.js";
import { methods as publicacionController } from "./controllers/publications.controller.js";
import { methods as perfilController } from "./controllers/perfil.controller.js"; //
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== CONFIGURACIÓN DEL SERVIDOR ====================

// Inicializa la aplicación Express y configura el puerto
const app = express();
app.set("port", process.env.PORT || 4000);

// Middleware para parsear JSON en las solicitudes
app.use(express.json());

// Servir archivos estáticos SOLO desde la carpeta Public (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "Public")));

// Perfil (requiere token)
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario
  });
});

// ==================== RUTAS PÚBLICAS ====================

// Rutas para servir páginas HTML públicas
app.get("/", (req, res) => {
  // Página principal
  res.sendFile(path.join(__dirname, "Pages", "index.html"));
});

app.get("/login", (req, res) => {
  // Página de inicio de sesión
  res.sendFile(path.join(__dirname, "Pages", "Login.html"));
});

app.get("/registro", (req, res) => {
  // Página de registro de usuario
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

// RUTA DE PERFIL (con codificación correcta)
app.get("/Sesion_De_Perfil", (req, res) => {
  const rutaPerfil = path.join(__dirname, "Pages", "Sesion_De_Perfil.html");
  console.log(" Buscando archivo de perfil:", rutaPerfil);

  res.sendFile(rutaPerfil, (err) => {
    if (err) {
      console.error(" No se pudo enviar el archivo:", err.message);
      
      const rutaAlternativa = path.join(__dirname, "Pages", "Sesion_De_Perfil.html");
      console.log("Intentando ruta alternativa:", rutaAlternativa);
      
      res.sendFile(rutaAlternativa, (err2) => {
        if (err2) {
          console.error("Tampoco se encontró la ruta alternativa:", err2.message);
          res.status(500).send("Error al cargar la página de perfil. Verifica que el archivo exista en Pages/");
        }
      });
    } else {
      console.log("Página de perfil enviada correctamente");
    }
  });
});

// Ruta alternativa sin acento (por si acaso)
app.get("/Sesion_De_Perfil", (req, res) => {
  res.redirect("/Sesión_De_Perfil");
});

// API de autenticación (rutas públicas)
app.post("/api/login", authController.login);      // Iniciar sesión
app.post("/api/register", authController.register); // Registrar usuario

// ==================== RUTAS PROTEGIDAS ====================

if (perfilController) {
  app.get("/api/perfil/datos", verificarToken, perfilController.obtenerPerfil);
  app.get("/api/perfil/proyectos", verificarToken, perfilController.obtenerHistorialProyectos);
  app.get("/api/perfil/publicaciones", verificarToken, perfilController.obtenerHistorialPublicaciones);
  app.get("/api/perfil/historial", verificarToken, perfilController.obtenerHistorialCompleto);
  console.log("Rutas de perfil registradas");
} else {
  // Rutas de respaldo si no existe el controlador
  app.get("/api/perfil/datos", verificarToken, (req, res) => {
    res.status(503).json({
      success: false,
      message: "El controlador de perfil no está disponible. Crea el archivo controllers/perfil.controller.js"
    });
  });
  app.get("/api/perfil/historial", verificarToken, (req, res) => {
    res.status(503).json({
      success: false,
      message: "El controlador de perfil no está disponible. Crea el archivo controllers/perfil.controller.js"
    });
  });
  console.log(" Rutas de perfil no disponibles - usando respaldo");
}

// Ruta de perfil básica
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario
  });
});


// Ruta solo para administradores (ID_rol = 1)
app.get("/api/admin/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  // Aquí podrías obtener todos los usuarios de la base de datos
  res.json({
    success: true,
    message: "Lista de usuarios (solo admin)"
  });
});

// Ruta para verificar si el token es válido (útil para el frontend)
app.get("/api/verificar-token", verificarToken, (req, res) => {
  res.json({
    success: true,
    valido: true,
    usuario: req.usuario
  });
});

// Ruta para cerrar sesión (la invalidación real del token es del lado del cliente)
app.post("/api/logout", verificarToken, (req, res) => {
  // En JWT no hay forma de "invalidar" tokens del lado del servidor
  // La invalidación se hace eliminando el token del localStorage en el cliente
  res.json({
    success: true,
    message: "Sesión cerrada exitosamente"
  });
});

//  RUTAS DE PERFIL
app.get("/api/perfil/datos", verificarToken, perfilController.obtenerPerfil);
app.get("/api/perfil/proyectos", verificarToken, perfilController.obtenerHistorialProyectos);
app.get("/api/perfil/publicaciones", verificarToken, perfilController.obtenerHistorialPublicaciones);
app.get("/api/perfil/historial", verificarToken, perfilController.obtenerHistorialCompleto);

// Ruta de perfil básica
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario
  });
});

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

// ==================== RUTAS DE PROYECTOS ====================

import { methods as proyectoController } from "./controllers/proyectos.controller.js";

// ✅ OBTENER TODOS LOS PROYECTOS (Pública - sin autenticación)
app.get("/api/proyectos", proyectoController.obtenerProyectos);

// ✅ OBTENER UN PROYECTO POR ID (Pública - sin autenticación)
app.get("/api/proyectos/:id", proyectoController.obtenerProyectoPorId);

// ✅ CREAR UN NUEVO PROYECTO (Protegida - requiere autenticación)
app.post("/api/proyectos", verificarToken, proyectoController.crearProyecto);

// ✅ EDITAR UN PROYECTO (Protegida - solo el autor)
app.put("/api/proyectos/:id", verificarToken, proyectoController.editarProyecto);

// ✅ ELIMINAR UN PROYECTO (Protegida - solo el autor)
app.delete("/api/proyectos/:id", verificarToken, proyectoController.eliminarProyecto);

console.log('✅ Rutas de proyectos registradas');

// ==================== MANEJO DE ERRORES ====================

// Ruta para manejar solicitudes a rutas no existentes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
});

// Middleware global para manejo de errores del servidor
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor"
  });
});

// ==================== INICIAR SERVIDOR ====================

// Inicia el servidor y muestra el puerto en consola
app.listen(app.get("port"), () => {
  console.log(`✅ Servidor corriendo en http://localhost:${app.get("port")}`);
});
