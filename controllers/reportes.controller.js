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
 * Reportar un proyecto
 */
async function reportarProyecto(req, res) {
  try {
    const { id: ID_proyecto } = req.params;
    const { motivo, descripcion } = req.body;
    const ID_usuario_reporta = req.usuario.id;

    console.log('🚨 Reportando proyecto:', { ID_proyecto, ID_usuario_reporta, motivo });

    // Validaciones
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: "El motivo del reporte es obligatorio"
      });
    }

    // Verificar que el proyecto existe
    const [proyectos] = await db.query(
      'SELECT ID_proyecto FROM proyecto WHERE ID_proyecto = ?',
      [ID_proyecto]
    );

    if (proyectos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado"
      });
    }

    // Verificar si el usuario ya reportó este proyecto
    const [reportesExistentes] = await db.query(
      'SELECT ID_reporte FROM reporte_proyectos WHERE ID_proyecto = ? AND ID_usuario_reporta = ?',
      [ID_proyecto, ID_usuario_reporta]
    );

    if (reportesExistentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya has reportado este proyecto anteriormente"
      });
    }

    // Insertar el reporte
    const [resultado] = await db.query(
      `INSERT INTO reporte_proyectos 
       (ID_proyecto, ID_usuario_reporta, motivo, descripcion, estado) 
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [ID_proyecto, ID_usuario_reporta, motivo, descripcion || null]
    );

    console.log('✅ Reporte de proyecto creado con ID:', resultado.insertId);

    res.status(201).json({
      success: true,
      message: "Reporte enviado exitosamente. Será revisado por un administrador."
    });

  } catch (error) {
    console.error("❌ Error al reportar proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al procesar el reporte",
      error: error.message
    });
  }
}

/**
 * Reportar un comentario de proyecto
 */
async function reportarComentario(req, res) {
  try {
    const { id: ID_comentario } = req.params;
    const { motivo, descripcion } = req.body;
    const ID_usuario_reporta = req.usuario.id;

    console.log('🚨 Reportando comentario:', { ID_comentario, ID_usuario_reporta, motivo });

    // Validaciones
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: "El motivo del reporte es obligatorio"
      });
    }

    // Verificar que el comentario existe
    const [comentarios] = await db.query(
      'SELECT ID_comentario FROM comentario_proyecto WHERE ID_comentario = ?',
      [ID_comentario]
    );

    if (comentarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comentario no encontrado"
      });
    }

    // Verificar si el usuario ya reportó este comentario
    const [reportesExistentes] = await db.query(
      'SELECT ID_reporte FROM reporte_comentarios WHERE ID_comentario = ? AND ID_usuario_reporta = ?',
      [ID_comentario, ID_usuario_reporta]
    );

    if (reportesExistentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya has reportado este comentario anteriormente"
      });
    }

    // Insertar el reporte
    const [resultado] = await db.query(
      `INSERT INTO reporte_comentarios 
       (ID_comentario, ID_usuario_reporta, motivo, descripcion, estado) 
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [ID_comentario, ID_usuario_reporta, motivo, descripcion || null]
    );

    console.log('✅ Reporte de comentario creado con ID:', resultado.insertId);

    res.status(201).json({
      success: true,
      message: "Reporte enviado exitosamente. Será revisado por un administrador."
    });

  } catch (error) {
    console.error("❌ Error al reportar comentario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al procesar el reporte",
      error: error.message
    });
  }
}

/**
 * Obtener todos los reportes de publicaciones (solo admin)
 */
async function obtenerReportesPublicaciones(req, res) {
  try {
    console.log('📋 Obteniendo reportes de publicaciones...');

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

    console.log(`✅ ${reportes.length} reportes de publicaciones encontrados`);

    res.json({
      success: true,
      reportes
    });

  } catch (error) {
    console.error("❌ Error al obtener reportes de publicaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener los reportes",
      error: error.message
    });
  }
}

/**
 * Obtener todos los reportes de proyectos (solo admin)
 */
async function obtenerReportesProyectos(req, res) {
  try {
    console.log('📋 Obteniendo reportes de proyectos...');

    const [reportes] = await db.query(`
      SELECT 
        r.ID_reporte,
        r.ID_proyecto,
        r.motivo,
        r.descripcion,
        r.fecha_reporte,
        r.estado,
        u.nombre as nombre_reportante,
        u.apellido as apellido_reportante,
        p.nombre as nombre_proyecto,
        p.descripcion as descripcion_proyecto
      FROM reporte_proyectos r
      INNER JOIN usuario u ON r.ID_usuario_reporta = u.ID_usuario
      INNER JOIN proyecto p ON r.ID_proyecto = p.ID_proyecto
      ORDER BY r.fecha_reporte DESC
    `);

    console.log(`✅ ${reportes.length} reportes de proyectos encontrados`);

    res.json({
      success: true,
      reportes
    });

  } catch (error) {
    console.error("❌ Error al obtener reportes de proyectos:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener los reportes",
      error: error.message
    });
  }
}

/**
 * Obtener todos los reportes de comentarios (solo admin)
 */
async function obtenerReportesComentarios(req, res) {
  try {
    console.log('📋 Obteniendo reportes de comentarios...');

    const [reportes] = await db.query(`
      SELECT 
        r.ID_reporte,
        r.ID_comentario,
        r.motivo,
        r.descripcion,
        r.fecha_reporte,
        r.estado,
        u.nombre as nombre_reportante,
        u.apellido as apellido_reportante,
        c.contenido as contenido_comentario,
        p.nombre as nombre_proyecto
      FROM reporte_comentarios r
      INNER JOIN usuario u ON r.ID_usuario_reporta = u.ID_usuario
      INNER JOIN comentario_proyecto c ON r.ID_comentario = c.ID_comentario
      INNER JOIN proyecto p ON c.ID_proyecto = p.ID_proyecto
      ORDER BY r.fecha_reporte DESC
    `);

    console.log(`✅ ${reportes.length} reportes de comentarios encontrados`);

    res.json({
      success: true,
      reportes
    });

  } catch (error) {
    console.error("❌ Error al obtener reportes de comentarios:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener los reportes",
      error: error.message
    });
  }
}

/**
 * Obtener TODOS los reportes (publicaciones, proyectos y comentarios)
 */
async function obtenerTodosLosReportes(req, res) {
  try {
    console.log('📋 Obteniendo TODOS los reportes...');

    // Obtener reportes de publicaciones
    const [reportesPublicaciones] = await db.query(`
      SELECT 
        r.ID_reporte,
        'publicacion' as tipo,
        r.ID_publicacion as id_contenido,
        r.motivo,
        r.descripcion,
        r.fecha_reporte,
        r.estado,
        u.nombre as nombre_reportante,
        u.apellido as apellido_reportante,
        p.titulo as titulo,
        p.contenido
      FROM reporte_publicaciones r
      INNER JOIN usuario u ON r.ID_usuario_reporta = u.ID_usuario
      INNER JOIN publicacion p ON r.ID_publicacion = p.ID_publicacion
    `);

    // Obtener reportes de proyectos
    const [reportesProyectos] = await db.query(`
      SELECT 
        r.ID_reporte,
        'proyecto' as tipo,
        r.ID_proyecto as id_contenido,
        r.motivo,
        r.descripcion,
        r.fecha_reporte,
        r.estado,
        u.nombre as nombre_reportante,
        u.apellido as apellido_reportante,
        p.nombre as titulo,
        p.descripcion as contenido
      FROM reporte_proyectos r
      INNER JOIN usuario u ON r.ID_usuario_reporta = u.ID_usuario
      INNER JOIN proyecto p ON r.ID_proyecto = p.ID_proyecto
    `);

    // Obtener reportes de comentarios
    const [reportesComentarios] = await db.query(`
      SELECT 
        r.ID_reporte,
        'comentario' as tipo,
        r.ID_comentario as id_contenido,
        r.motivo,
        r.descripcion,
        r.fecha_reporte,
        r.estado,
        u.nombre as nombre_reportante,
        u.apellido as apellido_reportante,
        CONCAT('Comentario en: ', p.nombre) as titulo,
        c.contenido
      FROM reporte_comentarios r
      INNER JOIN usuario u ON r.ID_usuario_reporta = u.ID_usuario
      INNER JOIN comentario_proyecto c ON r.ID_comentario = c.ID_comentario
      INNER JOIN proyecto p ON c.ID_proyecto = p.ID_proyecto
    `);

    // Combinar todos los reportes y ordenar por fecha
    const todosLosReportes = [
      ...reportesPublicaciones,
      ...reportesProyectos,
      ...reportesComentarios
    ].sort((a, b) => new Date(b.fecha_reporte) - new Date(a.fecha_reporte));

    console.log(`✅ Total de reportes: ${todosLosReportes.length}`);

    res.json({
      success: true,
      reportes: todosLosReportes,
      total: todosLosReportes.length,
      por_tipo: {
        publicaciones: reportesPublicaciones.length,
        proyectos: reportesProyectos.length,
        comentarios: reportesComentarios.length
      }
    });

  } catch (error) {
    console.error("❌ Error al obtener todos los reportes:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener los reportes",
      error: error.message
    });
  }
}

// ✅ EXPORTAR TODAS LAS FUNCIONES
export const methods = {
  reportarPublicacion,
  reportarProyecto,
  reportarComentario,
  obtenerReportesPublicaciones,
  obtenerReportesProyectos,
  obtenerReportesComentarios,
  obtenerTodosLosReportes
};