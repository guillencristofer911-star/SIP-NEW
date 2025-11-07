import db from '../database/db.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Reportar una publicación
 */
async function reportarPublicacion(req, res) {
  try {
    const { id: ID_publicacion } = req.params;
    const { motivo, descripcion } = req.body;
    const ID_usuario_reporta = req.usuario.id;

    console.log('🚨 Reportando publicación:', { ID_publicacion, ID_usuario_reporta, motivo });

    // Validaciones
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: "El motivo del reporte es obligatorio"
      });
    }

    // Verificar que la publicación existe
    const [publicaciones] = await db.query(
      'SELECT ID_publicacion FROM publicacion WHERE ID_publicacion = ?',
      [ID_publicacion]
    );

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada"
      });
    }

    // Verificar si el usuario ya reportó esta publicación
    const [reportesExistentes] = await db.query(
      'SELECT ID_reporte FROM reporte_publicaciones WHERE ID_publicacion = ? AND ID_usuario_reporta = ?',
      [ID_publicacion, ID_usuario_reporta]
    );

    if (reportesExistentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya has reportado esta publicación anteriormente"
      });
    }

    // Insertar el reporte
    const [resultado] = await db.query(
      `INSERT INTO reporte_publicaciones 
       (ID_publicacion, ID_usuario_reporta, motivo, descripcion, estado) 
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [ID_publicacion, ID_usuario_reporta, motivo, descripcion || null]
    );

    console.log('✅ Reporte creado con ID:', resultado.insertId);

    res.status(201).json({
      success: true,
      message: "Reporte enviado exitosamente. Será revisado por un administrador."
    });

  } catch (error) {
    console.error("❌ Error al reportar publicación:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al procesar el reporte",
      error: error.message
    });
  }
}

/**
 * Obtener todos los reportes (solo admin)
 */
async function obtenerReportes(req, res) {
  try {
    console.log('📋 Obteniendo reportes...');

    const [reportes] = await db.query(`
      SELECT 
        r.ID_reporte,
        r.ID_publicacion,
        r.motivo,
        r.descripcion,
        r.fecha_reporte,
        r.estado,
        u.nombre as nombre_reportante,
        u.apellido as apellido_reportante,
        p.titulo as titulo_publicacion,
        p.contenido as contenido_publicacion
      FROM reporte_publicaciones r
      INNER JOIN usuario u ON r.ID_usuario_reporta = u.ID_usuario
      INNER JOIN publicacion p ON r.ID_publicacion = p.ID_publicacion
      ORDER BY r.fecha_reporte DESC
    `);

    console.log(`✅ ${reportes.length} reportes encontrados`);

    res.json({
      success: true,
      reportes
    });

  } catch (error) {
    console.error("❌ Error al obtener reportes:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener los reportes",
      error: error.message
    });
  }
}

export const methods = {
  reportarPublicacion,
  obtenerReportes
};