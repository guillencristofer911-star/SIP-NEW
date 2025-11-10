// ==================== CONTROLADOR DE NOTIFICACIONES ====================
// Crear archivo: controllers/notificaciones.controller.js

import db from '../database/db.js';

// ============================================
// CREAR NOTIFICACIÓN
// ============================================
export async function crearNotificacion(req, res) {
    const { ID_usuario_destino, tipo, contenido, ID_referencia, url_referencia } = req.body;
    
    try {
        const query = `
            INSERT INTO notificacion 
            (ID_usuario_destino, tipo, contenido, ID_referencia, url_referencia, leida, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, 0, NOW())
        `;
        
        const [result] = await db.execute(query, [
            ID_usuario_destino,
            tipo,
            contenido,
            ID_referencia,
            url_referencia
        ]);
        
        res.json({
            success: true,
            message: 'Notificación creada',
            notificacion_id: result.insertId
        });
        
    } catch (error) {
        console.error('❌ Error al crear notificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear notificación'
        });
    }
}

// ============================================
// OBTENER NOTIFICACIONES DE UN USUARIO
// ============================================
export async function obtenerNotificaciones(req, res) {
    const usuarioId = req.usuario.documento || req.usuario.id;
    
    try {
        const query = `
            SELECT 
                n.ID_notificacion,
                n.tipo,
                n.contenido,
                n.ID_referencia,
                n.url_referencia,
                n.leida,
                n.fecha_creacion,
                u.nombre AS nombre_emisor,
                u.apellido AS apellido_emisor,
                u.ID_rol
            FROM notificacion n
            LEFT JOIN usuario u ON n.ID_usuario_emisor = u.ID_usuario
            WHERE n.ID_usuario_destino = (SELECT ID_usuario FROM usuario WHERE documento = ?)
            ORDER BY n.fecha_creacion DESC
            LIMIT 50
        `;
        
        const [notificaciones] = await db.execute(query, [usuarioId]);
        
        // Formatear notificaciones
        const notificacionesFormateadas = notificaciones.map(n => ({
            ...n,
            nombre_completo: `${n.nombre_emisor || ''} ${n.apellido_emisor || ''}`.trim(),
            inicial: (n.nombre_emisor || 'U').charAt(0).toUpperCase(),
            tiempo_relativo: calcularTiempoRelativo(n.fecha_creacion)
        }));
        
        res.json({
            success: true,
            notificaciones: notificacionesFormateadas,
            no_leidas: notificaciones.filter(n => !n.leida).length
        });
        
    } catch (error) {
        console.error('❌ Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener notificaciones'
        });
    }
}

// ============================================
// MARCAR NOTIFICACIÓN COMO LEÍDA
// ============================================
export async function marcarComoLeida(req, res) {
    const { id } = req.params;
    const usuarioId = req.usuario.documento || req.usuario.id;
    
    try {
        const query = `
            UPDATE notificacion n
            INNER JOIN usuario u ON n.ID_usuario_destino = u.ID_usuario
            SET n.leida = 1
            WHERE n.ID_notificacion = ? AND u.documento = ?
        `;
        
        await db.execute(query, [id, usuarioId]);
        
        res.json({
            success: true,
            message: 'Notificación marcada como leída'
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar notificación'
        });
    }
}

// ============================================
// MARCAR TODAS COMO LEÍDAS
// ============================================
export async function marcarTodasComoLeidas(req, res) {
    const usuarioId = req.usuario.documento || req.usuario.id;
    
    try {
        const query = `
            UPDATE notificacion n
            INNER JOIN usuario u ON n.ID_usuario_destino = u.ID_usuario
            SET n.leida = 1
            WHERE u.documento = ? AND n.leida = 0
        `;
        
        await db.execute(query, [usuarioId]);
        
        res.json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas'
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar notificaciones'
        });
    }
}

// ============================================
// FUNCIÓN AUXILIAR: NOTIFICAR RESPUESTA A PUBLICACIÓN
// ============================================
export async function notificarRespuestaPublicacion(ID_publicacion, ID_usuario_responde) {
    try {
        // Obtener datos de la publicación y su autor
        const [publicacion] = await db.execute(`
            SELECT p.titulo, p.ID_usuario, u.nombre, u.apellido
            FROM publicacion p
            INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
            WHERE p.ID_publicacion = ?
        `, [ID_publicacion]);
        
        if (publicacion.length === 0) return;
        
        const autor = publicacion[0];
        
        // No notificar si el autor responde su propia publicación
        if (autor.ID_usuario === ID_usuario_responde) return;
        
        // Obtener datos de quien responde
        const [responde] = await db.execute(`
            SELECT nombre, apellido FROM usuario WHERE ID_usuario = ?
        `, [ID_usuario_responde]);
        
        if (responde.length === 0) return;
        
        const nombreResponde = `${responde[0].nombre} ${responde[0].apellido}`;
        
        // Crear notificación
        await db.execute(`
            INSERT INTO notificacion 
            (ID_usuario_destino, ID_usuario_emisor, tipo, contenido, ID_referencia, url_referencia, leida, fecha_creacion)
            VALUES (?, ?, 'respuesta_publicacion', ?, ?, ?, 0, NOW())
        `, [
            autor.ID_usuario,
            ID_usuario_responde,
            `${nombreResponde} respondió tu publicación "${autor.titulo}"`,
            ID_publicacion,
            `/publicaciones?id=${ID_publicacion}`
        ]);
        
        console.log('✅ Notificación creada para publicación:', ID_publicacion);
        
    } catch (error) {
        console.error('❌ Error al notificar respuesta:', error);
    }
}

// ============================================
// FUNCIÓN AUXILIAR: NOTIFICAR COMENTARIO A PROYECTO
// ============================================
export async function notificarComentarioProyecto(ID_proyecto, ID_usuario_comenta) {
    try {
        // Obtener datos del proyecto y su autor
        const [proyecto] = await db.execute(`
            SELECT p.nombre, p.ID_usuario, u.nombre AS nombre_autor, u.apellido AS apellido_autor
            FROM proyecto p
            INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
            WHERE p.ID_proyecto = ?
        `, [ID_proyecto]);
        
        if (proyecto.length === 0) return;
        
        const autor = proyecto[0];
        
        // No notificar si el autor comenta su propio proyecto
        if (autor.ID_usuario === ID_usuario_comenta) return;
        
        // Obtener datos de quien comenta
        const [comenta] = await db.execute(`
            SELECT nombre, apellido FROM usuario WHERE ID_usuario = ?
        `, [ID_usuario_comenta]);
        
        if (comenta.length === 0) return;
        
        const nombreComenta = `${comenta[0].nombre} ${comenta[0].apellido}`;
        
        // Crear notificación
        await db.execute(`
            INSERT INTO notificacion 
            (ID_usuario_destino, ID_usuario_emisor, tipo, contenido, ID_referencia, url_referencia, leida, fecha_creacion)
            VALUES (?, ?, 'comentario_proyecto', ?, ?, ?, 0, NOW())
        `, [
            autor.ID_usuario,
            ID_usuario_comenta,
            `${nombreComenta} comentó tu proyecto "${autor.nombre}"`,
            ID_proyecto,
            `/Detalles_Proyecto.html?id=${ID_proyecto}`
        ]);
        
        console.log('✅ Notificación creada para proyecto:', ID_proyecto);
        
    } catch (error) {
        console.error('❌ Error al notificar comentario:', error);
    }
}

// ============================================
// UTILIDADES
// ============================================
function calcularTiempoRelativo(fecha) {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diferencia = ahora - fechaNotif;
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos}m`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return fechaNotif.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export const methods = {
    crearNotificacion,
    obtenerNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    notificarRespuestaPublicacion,
    notificarComentarioProyecto
};