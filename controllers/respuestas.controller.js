import db from '../database/db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

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
      'SELECT ID_publicacion FROM publicacion WHERE ID_publicacion = ? AND ID_estado_publicacion = 1',
      [ID_publicacion]
    );

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada"
      });
    }

    // 🔥 GENERAR TOKEN Y FECHA DE EXPIRACIÓN (15 minutos)
    const tokenEdicion = generarTokenEdicion();
    const tokenExpiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos desde ahora

    // Insertar la respuesta con token
    const [resultado] = await db.query(
      `INSERT INTO respuesta_publicacion 
       (ID_publicacion, ID_usuario, contenido, token_edicion, token_expiracion) 
       VALUES (?, ?, ?, ?, ?)`,
      [ID_publicacion, ID_usuario, contenido.trim(), tokenEdicion, tokenExpiracion]
    );

    const ID_respuesta = resultado.insertId;

    // Obtener la respuesta completa con datos del usuario
    const [respuestaCreada] = await db.query(`
      SELECT 
        r.ID_respuesta,
        r.contenido,
        DATE_FORMAT(r.fecha_creacion, '%Y-%m-%dT%H:%i:%s') as fecha_creacion,
        UNIX_TIMESTAMP(r.fecha_creacion) as fecha_creacion_timestamp,
        r.token_edicion,
        r.token_expiracion,
        r.ID_usuario,
        u.nombre,
        u.apellido,
        u.ID_rol,
        rol.nombre as rol_nombre
      FROM respuesta_publicacion r
      INNER JOIN usuario u ON r.ID_usuario = u.ID_usuario
      LEFT JOIN rol ON u.ID_rol = rol.ID_rol
      WHERE r.ID_respuesta = ?
    `, [ID_respuesta]);

    console.log('✅ Respuesta creada con ID:', ID_respuesta);
    console.log('🔐 Token generado, expira:', tokenExpiracion);

    res.status(201).json({
      success: true,
      message: "Respuesta creada exitosamente",
      respuesta: respuestaCreada[0]
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

// 🔥 CORRECCIÓN EN obtenerRespuestas()
async function obtenerRespuestas(req, res) {
  try {
    const { id: ID_publicacion } = req.params;

    console.log('📖 Obteniendo respuestas de publicación:', ID_publicacion);

    // 🔥 VALIDAR QUE ID_publicacion ES VÁLIDO
    if (!ID_publicacion || isNaN(parseInt(ID_publicacion))) {
      return res.status(400).json({
        success: false,
        message: "ID de publicación inválido"
      });
    }

    const [respuestas] = await db.query(`
      SELECT 
        r.ID_respuesta,
        r.ID_publicacion,
        r.contenido,
        r.fecha_creacion,
        UNIX_TIMESTAMP(r.fecha_creacion) as fecha_creacion_timestamp,
        r.fecha_ultima_edicion,
        UNIX_TIMESTAMP(r.fecha_ultima_edicion) as fecha_edicion_timestamp,
        r.token_expiracion,
        UNIX_TIMESTAMP(NOW()) as ahora_timestamp,
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

    console.log(`✅ ${respuestas.length} respuestas encontradas para publicación ${ID_publicacion}`);
    
    // 🔥 PROCESAR CADA RESPUESTA CON VALIDACIONES
    const respuestasProcesadas = respuestas.map(respuesta => {
      try {
        // Obtener timestamp actual del servidor
        const ahoraTimestamp = respuesta.ahora_timestamp;
        
        // Calcular si puede editar usando token_expiracion
        const expiracionTimestamp = Math.floor(new Date(respuesta.token_expiracion).getTime() / 1000);
        const puedeEditar = ahoraTimestamp < expiracionTimestamp;
        
        // Calcular minutos restantes
        const diferenciaSegundos = expiracionTimestamp - ahoraTimestamp;
        const minutosRestantes = Math.max(0, Math.floor(diferenciaSegundos / 60));
        
        // 🔥 CONVERTIR TIMESTAMP A MILISEGUNDOS PARA JAVASCRIPT
        const fecha_creacion_js = respuesta.fecha_creacion_timestamp * 1000;
        
        // Verificar si fue editada
        let fue_editada = false;
        if (respuesta.fecha_edicion_timestamp && respuesta.fecha_creacion_timestamp) {
          const diferenciaSeg = Math.abs(respuesta.fecha_edicion_timestamp - respuesta.fecha_creacion_timestamp);
          fue_editada = diferenciaSeg > 2;
        }
        
        return {
          ID_respuesta: respuesta.ID_respuesta,
          ID_publicacion: respuesta.ID_publicacion,
          contenido: respuesta.contenido,
          fecha_creacion: respuesta.fecha_creacion,
          fecha_creacion_js: fecha_creacion_js,
          fecha_ultima_edicion: respuesta.fecha_ultima_edicion,
          fue_editada: fue_editada,
          puedeEditar: puedeEditar,
          minutosRestantes: minutosRestantes,
          ID_usuario: respuesta.ID_usuario,
          nombre: respuesta.nombre,
          apellido: respuesta.apellido,
          programa: respuesta.programa,
          ID_rol: respuesta.ID_rol,
          rol: respuesta.rol_nombre || 'Usuario',
          rol_nombre: respuesta.rol_nombre
        };
      } catch (processingError) {
        console.error('❌ Error procesando respuesta:', processingError);
        // Devolver respuesta básica si hay error
        return {
          ID_respuesta: respuesta.ID_respuesta,
          contenido: respuesta.contenido,
          fecha_creacion: respuesta.fecha_creacion,
          fecha_creacion_js: Date.now(),
          puedeEditar: false,
          minutosRestantes: 0,
          ID_usuario: respuesta.ID_usuario,
          nombre: respuesta.nombre || 'Usuario',
          apellido: respuesta.apellido || '',
          rol: 'Usuario'
        };
      }
    });

    console.log(`✅ Respuestas procesadas exitosamente`);

    res.json({
      success: true,
      respuestas: respuestasProcesadas,
      total: respuestasProcesadas.length
    });

  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    console.error("Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener las respuestas",
      error: error.message
    });
  }
}


/**
 * Obtener el conteo de respuestas de una publicación
 */
async function contarRespuestas(req, res) {
  try {
    const { id: ID_publicacion } = req.params;

    const [resultado] = await db.query(
      'SELECT COUNT(*) as total FROM respuesta_publicacion WHERE ID_publicacion = ?',
      [ID_publicacion]
    );

    res.json({
      success: true,
      total: resultado[0].total
    });

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
 * Editar una respuesta (solo el autor, dentro de 15 minutos según token)
 */
async function editarRespuesta(req, res) {
  try {
    const { id: ID_respuesta } = req.params;
    const { contenido } = req.body;
    const ID_usuario = req.usuario.id;

    console.log('✏️ Editando respuesta:', ID_respuesta);

    // Validaciones
    if (!contenido || contenido.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "El contenido debe tener al menos 10 caracteres"
      });
    }

    // Obtener la respuesta
    const [respuestas] = await db.query(
      'SELECT * FROM respuesta_publicacion WHERE ID_respuesta = ?',
      [ID_respuesta]
    );

    if (respuestas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Respuesta no encontrada"
      });
    }

    const respuesta = respuestas[0];

    // Verificar que es el autor
    if (respuesta.ID_usuario !== ID_usuario) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para editar esta respuesta"
      });
    }

    // 🔥 VERIFICAR LÍMITE DE TIEMPO USANDO token_expiracion
    const ahora = new Date();
    const expiracion = new Date(respuesta.token_expiracion);

    if (ahora > expiracion) {
      return res.status(403).json({
        success: false,
        message: "El tiempo límite para editar (15 minutos) ha expirado"
      });
    }

    // Actualizar la respuesta
    await db.query(
      'UPDATE respuesta_publicacion SET contenido = ?, fecha_ultima_edicion = NOW() WHERE ID_respuesta = ?',
      [contenido.trim(), ID_respuesta]
    );

    console.log('✅ Respuesta actualizada');

    res.json({
      success: true,
      message: "Respuesta actualizada exitosamente"
    });

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
 * Eliminar una respuesta (solo el autor)
 */
async function eliminarRespuesta(req, res) {
  try {
    const { id: ID_respuesta } = req.params;
    const ID_usuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 1;

    console.log('🗑️ Eliminando respuesta:', ID_respuesta);

    // Obtener la respuesta
    const [respuestas] = await db.query(
      'SELECT * FROM respuesta_publicacion WHERE ID_respuesta = ?',
      [ID_respuesta]
    );

    if (respuestas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Respuesta no encontrada"
      });
    }

    const respuesta = respuestas[0];

    // Verificar permisos (autor o admin)
    if (respuesta.ID_usuario !== ID_usuario && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar esta respuesta"
      });
    }

    // Eliminar físicamente
    await db.query('DELETE FROM respuesta_publicacion WHERE ID_respuesta = ?', [ID_respuesta]);

    console.log('✅ Respuesta eliminada');

    res.json({
      success: true,
      message: "Respuesta eliminada exitosamente"
    });

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
  obtenerRespuestas, // <-- Esta función actualizada
  contarRespuestas,
  editarRespuesta,
  eliminarRespuesta
};