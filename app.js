// ============================================
// SERVIDOR EXPRESS - SENA INTERACTIVE PORTAL
// ============================================
// Configuración completa del servidor backend
// con todas las rutas y middlewares necesarios

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

// ============================================
// IMPORTAR CONTROLADORES
// ============================================
import { methods as authController } from './controllers/authentication.controller.js';
import { methods as publicationsController } from './controllers/publications.controller.js';
import { methods as respuestasController } from './controllers/respuestas.controller.js';
import { methods as reportesController } from './controllers/reportes.controller.js';
import { methods as proyectosController } from './controllers/proyectos.controller.js';

// ============================================
// IMPORTAR MIDDLEWARES
// ============================================
import { verificarToken, verificarAdmin } from './middlewares/authMiddleware.js';
import { upload } from './middlewares/upload.js';
import middlewareFiltroContenido from './middlewares/filtroPalabrasMiddleware.js';

// ============================================
// IMPORTAR RUTAS
// ============================================
import filtroRoutes from './routes/filtro.routes.js';
import favoritosRoutes from './routes/favoritos.routes.js';

// ============================================
// IMPORTAR BASE DE DATOS
// ============================================
import db from './database/db.js';
import bcrypt from 'bcrypt';

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

/**
 * CORS - Permite peticiones desde cualquier origen
 */
app.use(cors());

/**
 * Body Parser - Para procesar JSON y formularios
 * Límite de 10MB para archivos grandes
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Middleware de logging - Registra todas las peticiones
 */
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
});

/**
 * Servir archivos estáticos
 * - /Public: CSS, JS, imágenes del sitio
 * - /uploads: Archivos subidos por usuarios
 */
app.use(express.static(path.join(__dirname, 'Public')));
app.use('/uploads', express.static(path.join(__dirname, 'Public/uploads')));

/**
 * Middleware de filtro de palabras (aplica globalmente)
 */
app.use(middlewareFiltroContenido);

// ============================================
// RUTAS DE FILTRO Y FAVORITOS (Routers externos)
// ============================================
app.use('/api', filtroRoutes);
app.use('/api/favoritos', favoritosRoutes);

// ============================================
// 🔐 RUTAS DE AUTENTICACIÓN (Públicas)
// ============================================

/**
 * POST /api/login
 * Inicia sesión de usuario
 * Body: { documento, contrasena }
 * Returns: { token, usuario }
 */
app.post('/api/login', authController.login);

/**
 * POST /api/register
 * Registra un nuevo usuario
 * Body: { documento, nombres, apellidos, correo, programa, contrasena, tipo }
 * Returns: { success, message, usuario }
 */
app.post('/api/register', authController.register);

// ============================================
// 📝 RUTAS DE PUBLICACIONES
// ============================================

/**
 * GET /api/publicaciones/buscar
 * Busca publicaciones con filtros
 * Query: ?keyword=&programa=&fecha=
 * Returns: { success, publicaciones[] }
 */
app.get('/api/publicaciones/buscar', publicationsController.buscarPublicaciones);

/**
 * GET /api/publicaciones
 * Obtiene todas las publicaciones activas
 * Returns: { success, publicaciones[] }
 */
app.get('/api/publicaciones', publicationsController.obtenerPublicaciones);

/**
 * GET /api/publicaciones/:id
 * Obtiene una publicación específica
 * Params: id - ID de la publicación
 * Returns: { success, publicacion }
 */
app.get('/api/publicaciones/:id', publicationsController.obtenerPublicacionPorId);

/**
 * POST /api/publicaciones
 * Crea una nueva publicación (requiere autenticación)
 * Body: { titulo, contenido, etiquetas[] }
 * Returns: { success, publicacion }
 */
app.post('/api/publicaciones', verificarToken, middlewareFiltroContenido, publicationsController.crearPublicacion);

/**
 * PUT /api/publicaciones/:id
 * Edita una publicación (solo autor, 15 min límite)
 * Params: id - ID de la publicación
 * Body: { titulo, contenido }
 * Returns: { success, message }
 */
app.put('/api/publicaciones/:id', verificarToken, middlewareFiltroContenido, publicationsController.editarPublicacion);

/**
 * DELETE /api/publicaciones/:id
 * Elimina una publicación (solo autor o admin)
 * Params: id - ID de la publicación
 * Returns: { success, message }
 */
app.delete('/api/publicaciones/:id', verificarToken, publicationsController.eliminarPublicacion);

// ============================================
// 💬 RUTAS DE RESPUESTAS A PUBLICACIONES
// ============================================

/**
 * GET /api/publicaciones/:id/respuestas/contar
 * Cuenta las respuestas de una publicación
 * Params: id - ID de la publicación
 * Returns: { success, total }
 */
app.get('/api/publicaciones/:id/respuestas/contar', respuestasController.contarRespuestas);

/**
 * GET /api/publicaciones/:id/respuestas
 * Obtiene todas las respuestas de una publicación
 * Params: id - ID de la publicación
 * Returns: { success, respuestas[] }
 */
app.get('/api/publicaciones/:id/respuestas', respuestasController.obtenerRespuestas);

/**
 * POST /api/publicaciones/:id/respuestas
 * Crea una respuesta a una publicación (requiere auth)
 * Params: id - ID de la publicación
 * Body: { contenido }
 * Returns: { success, respuesta }
 */
app.post('/api/publicaciones/:id/respuestas', verificarToken, respuestasController.crearRespuesta);

/**
 * PUT /api/respuestas/:id
 * Edita una respuesta (solo autor, 15 min límite)
 * Params: id - ID de la respuesta
 * Body: { contenido }
 * Returns: { success, message }
 */
app.put('/api/respuestas/:id', verificarToken, respuestasController.editarRespuesta);

/**
 * DELETE /api/respuestas/:id
 * Elimina una respuesta (solo autor o admin)
 * Params: id - ID de la respuesta
 * Returns: { success, message }
 */
app.delete('/api/respuestas/:id', verificarToken, respuestasController.eliminarRespuesta);

// ============================================
// 📦 RUTAS DE PROYECTOS
// ============================================

/**
 * GET /api/proyectos/buscar
 * Busca proyectos con filtros
 * Query: ?keyword=&programa=&fecha=
 * Returns: { success, proyectos[] }
 */
app.get('/api/proyectos/buscar', proyectosController.buscarProyectos);

/**
 * GET /api/proyectos
 * Obtiene todos los proyectos activos
 * Returns: { success, proyectos[] }
 */
app.get('/api/proyectos', proyectosController.obtenerProyectos);

/**
 * GET /api/proyectos/:id
 * Obtiene un proyecto específico
 * Params: id - ID del proyecto
 * Returns: { success, proyecto }
 */
app.get('/api/proyectos/:id', proyectosController.obtenerProyectoPorId);

/**
 * 🔥 POST /api/proyectos/crear
 * Crea un nuevo proyecto con archivos (requiere auth)
 * Body (multipart/form-data):
 *   - titulo: string
 *   - descripcion: string
 *   - programa: string
 *   - github_url: string (opcional)
 *   - imagenes: file[] (máx 5 imágenes)
 *   - documento_pdf: file (opcional)
 * Returns: { success, proyecto_id }
 */
app.post('/api/proyectos/crear',
    upload.fields([
        { name: 'imagenes', maxCount: 5 },
        { name: 'documento_pdf', maxCount: 1 }
    ]),
    middlewareFiltroContenido,
    proyectosController.crearProyecto
);

/**
 * PUT /api/proyectos/:id/editar
 * Edita un proyecto (solo autor, 15 min límite)
 * Params: id - ID del proyecto
 * Body (multipart/form-data):
 *   - titulo: string
 *   - descripcion: string
 *   - programa: string
 *   - github_url: string (opcional)
 *   - imagenes: file[] (opcional)
 *   - documento_pdf: file (opcional)
 * Returns: { success, message }
 */
app.put('/api/proyectos/:id/editar',
    upload.fields([
        { name: 'imagenes', maxCount: 5 },
        { name: 'documento_pdf', maxCount: 1 }
    ]),
    proyectosController.editarProyecto
);

/**
 * DELETE /api/proyectos/:id/eliminar
 * Elimina un proyecto (eliminación lógica)
 * Params: id - ID del proyecto
 * Body: { user_id }
 * Returns: { success, message }
 */
app.delete('/api/proyectos/:id/eliminar', proyectosController.eliminarProyecto);

// ============================================
// 💬 RUTAS DE COMENTARIOS EN PROYECTOS
// ============================================

/**
 * GET /api/proyectos/:id/comentarios
 * Obtiene comentarios de un proyecto
 * Params: id - ID del proyecto
 * Query: ?user_id=
 * Returns: { success, comentarios[] }
 */
app.get('/api/proyectos/:id/comentarios', proyectosController.obtenerComentariosProyecto);

/**
 * POST /api/proyectos/:id/comentarios
 * Crea un comentario en un proyecto
 * Params: id - ID del proyecto
 * Body: { contenido, user_id }
 * Returns: { success, comentario }
 */
app.post('/api/proyectos/:id/comentarios', proyectosController.crearComentario);

/**
 * PUT /api/comentarios/:id/editar
 * Edita un comentario de proyecto
 * Params: id - ID del comentario
 * Body: { contenido, user_id }
 * Returns: { success, message }
 */
app.put('/api/comentarios/:id/editar', proyectosController.editarComentario);

/**
 * DELETE /api/comentarios/:id/eliminar
 * Elimina un comentario de proyecto
 * Params: id - ID del comentario
 * Body: { user_id }
 * Returns: { success, message }
 */
app.delete('/api/comentarios/:id/eliminar', proyectosController.eliminarComentario);

// ============================================
// 🚨 RUTAS DE REPORTES
// ============================================

/**
 * POST /api/publicaciones/:id/reportar
 * Reporta una publicación (requiere auth)
 * Params: id - ID de la publicación
 * Body: { motivo, descripcion }
 * Returns: { success, message }
 */
app.post('/api/publicaciones/:id/reportar', verificarToken, reportesController.reportarPublicacion);

/**
 * GET /api/reportes/todos
 * Obtiene todos los reportes (solo admin)
 * Returns: { success, reportes[] }
 */
app.get('/api/reportes/todos', verificarToken, verificarAdmin, reportesController.obtenerReportes);

// ============================================
// 👤 RUTAS DE PERFIL Y CONFIGURACIÓN
// ============================================

/**
 * GET /api/usuario/perfil
 * Obtiene el perfil del usuario actual (requiere auth)
 * Returns: { success, usuario }
 */
app.get('/api/usuario/perfil', verificarToken, async (req, res) => {
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

/**
 * PUT /api/usuario/editar
 * Edita el perfil del usuario (requiere auth)
 * Body: { correo, programa, password_actual?, password_nueva? }
 * Returns: { success, message, usuario }
 */
app.put('/api/usuario/editar', verificarToken, async (req, res) => {
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
            await db.execute(updateQuery, [correo, programa, hashedPassword, usuarioId]);

            console.log('✅ Contraseña actualizada correctamente');
        } else {
            const updateQuery = `
                UPDATE usuario
                SET correo = ?, programa = ? 
                WHERE documento = ?
            `;
            await db.execute(updateQuery, [correo, programa, usuarioId]);
            
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

/**
 * DELETE /api/usuario/eliminar
 * Elimina la cuenta del usuario (requiere auth)
 * Body: { confirmacion: true }
 * Returns: { success, message }
 */
app.delete('/api/usuario/eliminar', verificarToken, async (req, res) => {
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

// ============================================
// 🔒 RUTAS PROTEGIDAS ADICIONALES
// ============================================

/**
 * GET /api/perfil
 * Obtiene el perfil del usuario actual (alias)
 * Returns: { success, usuario }
 */
app.get('/api/perfil', verificarToken, (req, res) => {
    res.json({
        success: true,
        message: 'Perfil de usuario',
        usuario: req.usuario
    });
});

/**
 * GET /api/verificar-token
 * Verifica si un token JWT es válido
 * Returns: { success, valido, usuario }
 */
app.get('/api/verificar-token', verificarToken, (req, res) => {
    res.json({
        success: true,
        valido: true,
        usuario: req.usuario
    });
});

/**
 * POST /api/logout
 * Cierra la sesión del usuario
 * Returns: { success, message }
 */
app.post('/api/logout', verificarToken, (req, res) => {
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

// ============================================
// 📄 RUTAS DE PÁGINAS HTML
// ============================================

/**
 * Página de inicio
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/index.html'));
});

/**
 * Página de login
 */
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/Login.html'));
});

/**
 * Página de registro
 */
app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/Registro.html'));
});

/**
 * Feed de publicaciones
 */
app.get('/publicaciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/sesion-publicados.html'));
});

/**
 * Feed de proyectos
 */
app.get('/feed-proyectos', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/Feed_Proyectos.html'));
});

/**
 * Detalles de proyecto
 */
app.get('/Detalles_Proyecto.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/Detalles_Proyecto.html'));
});

/**
 * Página de configuración
 */
app.get('/configuracion', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/Configuración.html'));
});

/**
 * Panel de administración
 */
app.get('/admin/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/Admin_Panel.html'));
});

// ============================================
// ⚠️ MANEJO DE ERRORES 404
// ============================================

/**
 * Captura todas las rutas no encontradas
 */
app.use((req, res) => {
    console.log('❌ 404 - Ruta no encontrada:', req.method, req.url);
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada',
        ruta: req.url,
        metodo: req.method
    });
});

/**
 * Manejador de errores global
 */
app.use((err, req, res, next) => {
    console.error('❌ Error en el servidor:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// 🚀 INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📡 URL: http://localhost:' + PORT);
    console.log('📁 Archivos estáticos:', path.join(__dirname, 'Public'));
    console.log('📂 Uploads:', path.join(__dirname, 'Public/uploads'));
    console.log('');
    console.log('📚 RUTAS DE API REGISTRADAS:');
    console.log('');
    console.log('🔐 AUTENTICACIÓN:');
    console.log('   POST   /api/login');
    console.log('   POST   /api/register');
    console.log('   POST   /api/logout (auth)');
    console.log('   GET    /api/verificar-token (auth)');
    console.log('');
    console.log('📝 PUBLICACIONES:');
    console.log('   GET    /api/publicaciones');
    console.log('   GET    /api/publicaciones/buscar');
    console.log('   GET    /api/publicaciones/:id');
    console.log('   POST   /api/publicaciones (auth)');
    console.log('   PUT    /api/publicaciones/:id (auth)');
    console.log('   DELETE /api/publicaciones/:id (auth)');
    console.log('');
    console.log('💬 RESPUESTAS:');
    console.log('   GET    /api/publicaciones/:id/respuestas');
    console.log('   GET    /api/publicaciones/:id/respuestas/contar');
    console.log('   POST   /api/publicaciones/:id/respuestas (auth)');
    console.log('   PUT    /api/respuestas/:id (auth)');
    console.log('   DELETE /api/respuestas/:id (auth)');
    console.log('');
    console.log('📦 PROYECTOS:');
    console.log('   GET    /api/proyectos');
    console.log('   GET    /api/proyectos/buscar');
    console.log('   GET    /api/proyectos/:id');
    console.log('   POST   /api/proyectos/crear ⭐ (multipart)');
    console.log('   PUT    /api/proyectos/:id/editar (multipart)');
    console.log('   DELETE /api/proyectos/:id/eliminar');
    console.log('');
    console.log('💭 COMENTARIOS EN PROYECTOS:');
    console.log('   GET    /api/proyectos/:id/comentarios');
    console.log('   POST   /api/proyectos/:id/comentarios');
    console.log('   PUT    /api/comentarios/:id/editar');
    console.log('   DELETE /api/comentarios/:id/eliminar');
    console.log('');
    console.log('🚨 REPORTES:');
    console.log('   POST   /api/publicaciones/:id/reportar (auth)');
    console.log('   GET    /api/reportes/todos (admin)');
    console.log('');
    console.log('👤 PERFIL Y CONFIGURACIÓN:');
    console.log('   GET    /api/usuario/perfil (auth)');
    console.log('   PUT    /api/usuario/editar (auth)');
    console.log('   DELETE /api/usuario/eliminar (auth)');
    console.log('');
    console.log('⭐ FAVORITOS:');
    console.log('   POST   /api/favoritos/agregar (auth)');
    console.log('   GET    /api/favoritos/:ID_usuario (auth)');
    console.log('   DELETE /api/favoritos/eliminar (auth)');
    console.log('');
    console.log('🔍 FILTRO DE PALABRAS:');
    console.log('   POST   /api/filtro');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Servidor listo para recibir peticiones');
    console.log('═══════════════════════════════════════════════════════');
});

export default app;