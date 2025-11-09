import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import filtroRoutes from "./routes/filtro.routes.js";
import middlewareFiltroContenido from './middlewares/filtroPalabrasMiddleware.js';
import { methods as authController } from "./controllers/authentication.controller.js";
import { methods as proyectosController } from "./controllers/proyectos.controller.js";
import { methods as reportesController } from "./controllers/reportes.controller.js";
import { methods as publicacionController } from "./controllers/publications.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";
import { upload } from './middlewares/upload.js';
import bcrypt from 'bcrypt';
import db from "./database/db.js";
import favoritosRoutes from "./routes/favoritos.routes.js"; // agregado import faltante

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("port", process.env.PORT || 4000);

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "Public"))); // unificar carpeta pública
app.use('/uploads', express.static(path.join(__dirname, 'Public', 'uploads')));

// Si deseas aplicar el filtro globalmente, dejarlo; si no, moverlo solo a rutas que lo requieran
app.use(middlewareFiltroContenido);

// Rutas del router de filtro
app.use('/api', filtroRoutes);

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

app.get("/Configuracion", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Configuración.html"));
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

// Proyectos
app.post("/api/proyectos/crear",
  upload.fields([
    { name: 'imagenes', maxCount: 5 },
    { name: 'documento_pdf', maxCount: 1 }
  ]),
  middlewareFiltroContenido,
  proyectosController.crearProyecto
);

app.get("/api/proyectos", proyectosController.obtenerProyectos);
app.get("/api/proyectos/:id", proyectosController.obtenerProyectoPorId);

app.put("/api/proyectos/:id/editar",
  upload.fields([
    { name: 'imagenes', maxCount: 5 },
    { name: 'documento_pdf', maxCount: 1 }
  ]),
  proyectosController.editarProyecto
);

app.delete("/api/proyectos/:id/eliminar", proyectosController.eliminarProyecto);

// ==================== RUTAS DE CONFIGURACIÓN ====================

// Obtener perfil del usuario actual
app.get("/api/usuario/perfil", verificarToken, async (req, res) => {
  const usuarioId = req.usuario.documento || req.usuario.id;

  console.log('👤 Solicitando datos de perfil para:', usuarioId);

  try {
    const query = `
      SELECT 
        ID_usuario,
        documento,
        nombre,
        apellido,
        correo,
        programa,
        ID_rol,
        contresena,
        imagen_perfil,
        ID_estado_cuenta,
        fecha_registro
      FROM usuario
      WHERE documento = ?
    `;
    
    const [users] = await db.execute(query, [usuarioId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userData = users[0];
    
    const usuario = {
      ID_usuario: userData.ID_usuario,
      documento: userData.documento,
      nombre: userData.nombre,
      apellido: userData.apellido,
      nombre_completo: `${userData.nombre} ${userData.apellido}`.trim(),
      nombre_corto: userData.nombre,
      correo: userData.correo,
      email: userData.correo,
      programa: userData.programa,
      programa_autor: userData.programa,
      programa_formacion: userData.programa,
      rol: userData.ID_rol,
      rol_nombre: userData.ID_rol === 1 ? 'Administrador' : 
                  userData.ID_rol === 2 ? 'Aprendiz' : 
                  userData.ID_rol === 3 ? 'Egresado' : 'Usuario',
      contresena: userData.contresena,
      imagen_perfil: userData.imagen_perfil,
      ID_estado_cuenta: userData.ID_estado_cuenta,
      fecha_registro: userData.fecha_registro
    };

    console.log('📊 Datos de perfil enviados:', {
      nombre: usuario.nombre_completo,
      correo: usuario.correo,
      programa: usuario.programa
    });

    res.json({
      success: true,
      usuario: usuario
    });

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener el perfil'
    });
  }
});

// Editar perfil del usuario
app.put("/api/usuario/editar", verificarToken, async (req, res) => {
  const { correo, programa, password_actual, password_nueva } = req.body;
  const usuarioId = req.usuario.documento || req.usuario.id;

  console.log('📝 Solicitando edición de perfil para:', usuarioId);
  console.log('📦 Datos recibidos:', { correo, programa, password_actual: !!password_actual, password_nueva: !!password_nueva });

  if (!correo || !programa) {
    return res.status(400).json({
      success: false,
      message: 'Correo y programa son obligatorios'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({
      success: false,
      message: 'El formato del correo electrónico no es válido'
    });
  }

  try {
    const checkUserQuery = 'SELECT * FROM usuario WHERE documento = ?';
    const [existingUser] = await db.execute(checkUserQuery, [usuarioId]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const usuario = existingUser[0];
    console.log('👤 Usuario encontrado:', usuario.correo);

    if (password_actual && password_nueva) {
      console.log('🔐 Verificando cambio de contraseña...');
      
      const passwordValida = await bcrypt.compare(password_actual, usuario.contresena);
      if (!passwordValida) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      if (password_nueva.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 8 caracteres'
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password_nueva, saltRounds);

      const updateQuery = `
        UPDATE usuario
        SET correo = ?, programa = ?, contresena = ? 
        WHERE documento = ?
      `;
      const [result] = await db.execute(updateQuery, [correo, programa, hashedPassword, usuarioId]);

      console.log('✅ Contraseña actualizada correctamente');
    } else {
      const updateQuery = `
        UPDATE usuario
        SET correo = ?, programa = ? 
        WHERE documento = ?
      `;
      const [result] = await db.execute(updateQuery, [correo, programa, usuarioId]);
      
      console.log('✅ Perfil actualizado sin cambiar contraseña');
    }

    const getUpdatedUserQuery = `
      SELECT 
        ID_usuario,
        documento,
        nombre,
        apellido,
        correo,
        programa,
        ID_rol,
        imagen_perfil,
        ID_estado_cuenta,
        fecha_registro
      FROM usuario
      WHERE documento = ?
    `;
    const [updatedUser] = await db.execute(getUpdatedUserQuery, [usuarioId]);

    if (updatedUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Error al obtener datos actualizados'
      });
    }

    const userData = updatedUser[0];
    
    const usuarioActualizado = {
      ID_usuario: userData.ID_usuario,
      documento: userData.documento,
      nombre: userData.nombre,
      apellido: userData.apellido,
      nombre_completo: `${userData.nombre} ${userData.apellido}`.trim(),
      nombre_corto: userData.nombre,
      correo: userData.correo,
      email: userData.correo,
      programa: userData.programa,
      programa_autor: userData.programa,
      programa_formacion: userData.programa,
      rol: userData.ID_rol,
      rol_nombre: userData.ID_rol === 1 ? 'Administrador' : 
                  userData.ID_rol === 2 ? 'Aprendiz' : 
                  userData.ID_rol === 3 ? 'Egresado' : 'Usuario',
      imagen_perfil: userData.imagen_perfil,
      ID_estado_cuenta: userData.ID_estado_cuenta,
      fecha_registro: userData.fecha_registro
    };

    console.log('📊 Datos actualizados enviados:', {
      nombre: usuarioActualizado.nombre_completo,
      correo: usuarioActualizado.correo,
      programa: usuarioActualizado.programa,
      rol: usuarioActualizado.rol_nombre
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('❌ Error en editar perfil:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está en uso por otro usuario'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el perfil'
    });
  }
});

// Eliminar cuenta del usuario
app.delete("/api/usuario/eliminar", verificarToken, async (req, res) => {
  const usuarioId = req.usuario.documento || req.usuario.id;
  const { confirmacion } = req.body;

  console.log('🗑️ Solicitando eliminación de cuenta para:', usuarioId);

  if (!confirmacion) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere confirmación para eliminar la cuenta'
    });
  }

  try {
    const checkUserQuery = 'SELECT * FROM usuario WHERE documento = ?';
    const [existingUser] = await db.execute(checkUserQuery, [usuarioId]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('👤 Usuario encontrado, procediendo a eliminar...');

    const deleteUserQuery = 'DELETE FROM usuario WHERE documento = ?';
    const [result] = await db.execute(deleteUserQuery, [usuarioId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo eliminar el usuario'
      });
    }

    console.log('✅ Cuenta eliminada exitosamente:', usuarioId);

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la cuenta porque tiene publicaciones, proyectos o datos relacionados. Contacta al administrador.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar la cuenta'
    });
  }
});

// ==================== RUTAS DE Búsqueda de publicaciones ====================
app.get("/api/publicaciones/buscar", publicacionController.buscarPublicaciones);

// ==================== RUTAS DE Búsqueda de proyectos ====================
app.get("/api/proyectos/buscar", proyectosController.buscarProyectos);
// ==================== RUTAS DE REPORTES ====================
app.post("/api/publicaciones/:id/reportar", verificarToken, reportesController.reportarPublicacion);
app.get("/api/reportes", verificarToken, verificarAdmin, reportesController.obtenerReportes);

// ==================== RUTAS DE COMENTARIOS ====================
app.get("/api/proyectos/:id/comentarios", proyectosController.obtenerComentariosProyecto);
app.post("/api/proyectos/:id/comentarios", proyectosController.crearComentario);
app.put("/api/comentarios/:id/editar", proyectosController.editarComentario);
app.delete("/api/comentarios/:id/eliminar", proyectosController.eliminarComentario);

// ==================== RUTAS DE PUBLICACIONES ====================
app.get("/api/publicaciones", publicacionController.obtenerPublicaciones);
app.get("/api/publicaciones/:id", publicacionController.obtenerPublicacionPorId);
app.post("/api/publicaciones", verificarToken, middlewareFiltroContenido, publicacionController.crearPublicacion);
app.put("/api/publicaciones/:id", verificarToken, middlewareFiltroContenido, publicacionController.editarPublicacion);
app.delete("/api/publicaciones/:id", verificarToken, publicacionController.eliminarPublicacion);

// ==================== RUTAS PROTEGIDAS/ADMIN ====================
app.get("/api/perfil", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Perfil de usuario",
    usuario: req.usuario
  });
});

app.get("/api/admin/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  res.json({
    success: true,
    message: "Lista de usuarios (solo admin)"
  });
});

app.get("/api/verificar-token", verificarToken, (req, res) => {
  res.json({
    success: true,
    valido: true,
    usuario: req.usuario
  });
});

app.post("/api/logout", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Sesión cerrada exitosamente"
  });
});

// ==================== PANEL DE ADMINISTRACIÓN ====================
app.get("/admin/panel", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Admin_Panel.html"));
});

// Favoritos (router separado)
app.use("/api/favoritos", favoritosRoutes);

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

// ...existing code...