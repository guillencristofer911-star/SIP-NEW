import db from '../database/db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { crearNotificacion } from './notificaciones.controller.js';

dotenv.config();

/**
 * Generar token único para edición
 */
function generarTokenEdicion() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Crear una nueva respuesta a una publicación
 */
async function crearRespuesta(req, res) {
  try {
    const { id: ID_publicacion } = req.params;
    const { contenido } = req.body;
    const ID_usuario = req.usuario.id;

    console.log('💬 Creando respuesta:', { ID_publicacion, ID_usuario, contenido });

    // Validaciones
    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "El contenido de la respuesta es obligatorio"
      });
    }

    if (contenido.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "La respuesta debe tener al menos 10 caracteres"
      });
    }

    if (contenido.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "La respuesta no puede exceder 1000 caracteres"
      });
    }

    // Verificar que la publicación existe
    const [publicaciones] = await db.query(
      'SELECT ID_usuario FROM publicacion WHERE ID_publicacion = ? AND ID_estado_publicacion = 1',
      [ID_publicacion]
    );

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada"
      });
    }

    const idAutor = publicaciones[0].ID_usuario;

    // 🔥 GENERAR TOKEN Y FECHA DE EXPIRACIÓN (15 minutos)
    const tokenEdicion = generarTokenEdicion();
    const tokenExpiracion = new Date(Date.now() + 15 * 60 * 1000);

    // Insertar la respuesta
    const [resultado] = await db.query(
      `INSERT INTO respuesta_publicacion 
       (ID_publicacion, ID_usuario, contenido, token_edicion, token_expiracion, fecha_creacion) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [ID_publicacion, ID_usuario, contenido.trim(), tokenEdicion, tokenExpiracion]
    );

    const ID_respuesta = resultado.insertId;

    // Notificar al autor si es distinto
    if (idAutor !== ID_usuario) {
      const mensaje = "Tu publicación ha recibido una nueva respuesta.";
      await crearNotificacion(idAutor, mensaje);
    }

    res.status(201).json({
      success: true,
      message: "Respuesta creada exitosamente",
      ID_respuesta
    });

  } catch (error) {
    console.error("❌ Error al crear respuesta:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al crear la respuesta",
      error: error.message
    });
  }
}

/**
 * Obtener las respuestas de una publicación
 */
async function obtenerRespuestas(req, res) {
  try {
    const { id: ID_publicacion } = req.params;
    const [respuestas] = await db.query(`
      SELECT 
        r.ID_respuesta,
        r.ID_publicacion,
        r.contenido,
        DATE_FORMAT(r.fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion,
        UNIX_TIMESTAMP(r.fecha_creacion) as fecha_creacion_timestamp,
        DATE_FORMAT(r.fecha_ultima_edicion, '%Y-%m-%d %H:%i:%s') as fecha_ultima_edicion,
        UNIX_TIMESTAMP(r.fecha_ultima_edicion) as fecha_edicion_timestamp,
        r.token_expiracion,
        r.ID_usuario,
        u.nombre,
        u.apellido,
        u.programa,
        u.ID_rol,
        rol.nombre as rol_nombre
      FROM respuesta_publicacion r
      INNER JOIN usuario u ON r.ID_usuario = u.ID_usuario
      LEFT JOIN rol ON u.ID_rol = rol.ID_rol
      WHERE r.ID_publicacion = ?
      ORDER BY r.fecha_creacion DESC
    `, [ID_publicacion]);

    const ahora = new Date();
    const respuestasProcesadas = respuestas.map(r => {
      const expiracion = new Date(r.token_expiracion);
      const puedeEditar = ahora < expiracion;
      const diferenciaMs = expiracion - ahora;
      const minutosRestantes = Math.max(0, Math.floor(diferenciaMs / 60000));

      const fue_editada =
        r.fecha_edicion_timestamp &&
        r.fecha_creacion_timestamp &&
        Math.abs(r.fecha_edicion_timestamp - r.fecha_creacion_timestamp) > 2;

      return {
        ...r,
        puedeEditar,
        minutosRestantes,
        fue_editada,
        fecha_creacion_js: r.fecha_creacion_timestamp * 1000
      };
    });

    res.json({ success: true, respuestas: respuestasProcesadas });

  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener las respuestas",
      error: error.message
    });
  }
}

/**
 * Contar respuestas por publicación
 */
async function contarRespuestas(req, res) {
  try {
    const { id: ID_publicacion } = req.params;
    const [resultado] = await db.query(
      'SELECT COUNT(*) as total FROM respuesta_publicacion WHERE ID_publicacion = ?',
      [ID_publicacion]
    );
    res.json({ success: true, total: resultado[0].total });
  } catch (error) {
    console.error("❌ Error al contar respuestas:", error);
    res.status(500).json({
      success: false,
      message: "Error al contar respuestas",
      error: error.message
    });
  }
}

/**
 * Editar una respuesta
 */
async function editarRespuesta(req, res) {
  try {
    const { id: ID_respuesta } = req.params;
    const { contenido } = req.body;
    const ID_usuario = req.usuario.id;

    if (!contenido || contenido.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "El contenido debe tener al menos 10 caracteres"
      });
    }

    const [respuestas] = await db.query(
      'SELECT * FROM respuesta_publicacion WHERE ID_respuesta = ?',
      [ID_respuesta]
    );

    if (respuestas.length === 0)
      return res.status(404).json({ success: false, message: "Respuesta no encontrada" });

    const respuesta = respuestas[0];
    const expiracion = new Date(respuesta.token_expiracion);

    if (respuesta.ID_usuario !== ID_usuario)
      return res.status(403).json({ success: false, message: "No puedes editar esta respuesta" });

    if (new Date() > expiracion)
      return res.status(403).json({ success: false, message: "El tiempo límite para editar expiró" });

    await db.query(
      'UPDATE respuesta_publicacion SET contenido = ?, fecha_ultima_edicion = NOW() WHERE ID_respuesta = ?',
      [contenido.trim(), ID_respuesta]
    );

    res.json({ success: true, message: "Respuesta actualizada exitosamente" });

  } catch (error) {
    console.error("❌ Error al editar respuesta:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al editar la respuesta",
      error: error.message
    });
  }
}

/**
 * Eliminar una respuesta
 */
async function eliminarRespuesta(req, res) {
  try {
    const { id: ID_respuesta } = req.params;
    const ID_usuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 1;

    const [respuestas] = await db.query(
      'SELECT * FROM respuesta_publicacion WHERE ID_respuesta = ?',
      [ID_respuesta]
    );

    if (respuestas.length === 0)
      return res.status(404).json({ success: false, message: "Respuesta no encontrada" });

    const respuesta = respuestas[0];
    if (respuesta.ID_usuario !== ID_usuario && !esAdmin)
      return res.status(403).json({ success: false, message: "No tienes permisos para eliminarla" });

    await db.query('DELETE FROM respuesta_publicacion WHERE ID_respuesta = ?', [ID_respuesta]);

    res.json({ success: true, message: "Respuesta eliminada exitosamente" });

  } catch (error) {
    console.error("❌ Error al eliminar respuesta:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al eliminar la respuesta",
      error: error.message
    });
  }
}

export const methods = {
  crearRespuesta,
  obtenerRespuestas,
  contarRespuestas,
  editarRespuesta,
  eliminarRespuesta
};
