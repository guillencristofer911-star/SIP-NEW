import db from '../database/db.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Controlador para crear una nueva publicación.
 */
async function crearPublicacion(req, res) {
  try {
    const { titulo, contenido, etiquetas } = req.body;
    const ID_usuario = req.usuario.id;

    console.log('📝 Intentando crear publicación:', { titulo, contenido, ID_usuario });

    if (!titulo || !contenido) {
      return res.status(400).json({
        success: false,
        message: "El título y contenido son obligatorios"
      });
    }

    if (titulo.length < 5 || titulo.length > 100) {
      return res.status(400).json({
        success: false,
        message: "El título debe tener entre 5 y 100 caracteres"
      });
    }

    if (contenido.length < 10) {
      return res.status(400).json({
        success: false,
        message: "El contenido debe tener al menos 10 caracteres"
      });
    }

    // 🔥 OBTENER ROL DEL USUARIO
    const [usuarios] = await db.query(`
      SELECT u.ID_rol, r.nombre as rol_nombre
      FROM usuario u
      LEFT JOIN rol r ON u.ID_rol = r.ID_rol
      WHERE u.ID_usuario = ?
    `, [ID_usuario]);

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const usuario = usuarios[0];
    const ID_estado_publicacion = 1; // Estado activo

    console.log('💾 Guardando publicación con rol:', usuario.rol_nombre);

    // 🔥 INSERT MEJORADO: Incluye ID_rol_autor
    const [resultado] = await db.query(
      `INSERT INTO publicacion 
       (ID_usuario, titulo, contenido, ID_rol_autor, fecha_creacion, fecha_ultima_edicion, ID_estado_publicacion) 
       VALUES (?, ?, ?, ?, NOW(), NOW(), ?)`,
      [ID_usuario, titulo, contenido, usuario.ID_rol, ID_estado_publicacion]
    );

    const ID_publicacion = resultado.insertId;
    console.log('✅ Publicación creada con ID:', ID_publicacion);

    if (etiquetas && Array.isArray(etiquetas) && etiquetas.length > 0) {
      try {
        for (const ID_etiqueta of etiquetas) {
          await db.query(
            'INSERT INTO publicacion_etiqueta (ID_publicacion, ID_etiqueta) VALUES (?, ?)',
            [ID_publicacion, ID_etiqueta]
          );
        }
        console.log('🏷️ Etiquetas asociadas correctamente');
      } catch (etiquetaError) {
        console.warn("⚠️ Error al insertar etiquetas (no crítico):", etiquetaError.message);
      }
    }

    const ahoraTimestamp = Math.floor(Date.now() / 1000);

    res.status(201).json({
      success: true,
      message: "Publicación creada exitosamente",
      publicacion: {
        id: ID_publicacion,
        titulo,
        contenido,
        rol: usuario.rol_nombre,
        fecha_creacion: new Date().toISOString(),
        fecha_creacion_timestamp: ahoraTimestamp
      }
    });

  } catch (error) {
    console.error("❌ Error al crear publicación:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al crear la publicación",
      error: error.message
    });
  }
}

/**
 * Controlador para obtener todas las publicaciones.
 */
async function obtenerPublicaciones(req, res) {
  try {
    console.log('📖 Obteniendo todas las publicaciones...');

    // 🔥 CONSULTA MEJORADA: Incluye el rol del usuario
    const [publicaciones] = await db.query(`
      SELECT 
        p.ID_publicacion,
        p.titulo,
        p.contenido,
        UNIX_TIMESTAMP(p.fecha_creacion) as fecha_creacion_timestamp,
        p.fecha_creacion,
        p.fecha_ultima_edicion,
        p.ID_usuario,
        p.ID_estado_publicacion,
        u.nombre,
        u.apellido,
        u.programa,
        u.ID_rol,
        r.nombre as rol_nombre
      FROM publicacion p
      INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
      LEFT JOIN rol r ON u.ID_rol = r.ID_rol
      WHERE p.ID_estado_publicacion = 1
      ORDER BY p.fecha_creacion DESC
    `);

    console.log(`✅ Se encontraron ${publicaciones.length} publicaciones`);

    const ahoraTimestamp = Math.floor(Date.now() / 1000);
    
    for (let pub of publicaciones) {
      try {
        // Obtener etiquetas
        const [etiquetas] = await db.query(`
          SELECT e.ID_etiqueta, e.nombre
          FROM publicacion_etiqueta pe
          INNER JOIN etiqueta e ON pe.ID_etiqueta = e.ID_etiqueta
          WHERE pe.ID_publicacion = ?
        `, [pub.ID_publicacion]);
        
        pub.etiquetas = etiquetas;

        // Calcular tiempo usando timestamps de MySQL
        const diferenciaSegundos = ahoraTimestamp - pub.fecha_creacion_timestamp;
        const diferenciaMinutos = diferenciaSegundos / 60;
        const minutosRestantes = Math.max(0, Math.floor(15 - diferenciaMinutos));
        
        pub.puedeEditar = diferenciaMinutos <= 15;
        pub.minutosRestantes = minutosRestantes;

        // 🔥 Agregar información del rol
        pub.rol = pub.rol_nombre || 'usuario';

        console.log(`📝 Publicación ${pub.ID_publicacion}: ${diferenciaMinutos.toFixed(2)} min transcurridos, rol: ${pub.rol}`);
        
      } catch (etiquetaError) {
        console.warn(`⚠️ Error al obtener etiquetas para publicación ${pub.ID_publicacion}:`, etiquetaError.message);
        pub.etiquetas = [];
        pub.puedeEditar = false;
        pub.minutosRestantes = 0;
        pub.rol = 'usuario';
      }
    }

    res.json({
      success: true,
      publicaciones
    });

  } catch (error) {
    console.error("❌ Error al obtener publicaciones:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener las publicaciones",
      error: error.message
    });
  }
}

/**
 * Controlador para obtener una publicación por ID.
 */
async function obtenerPublicacionPorId(req, res) {
  try {
    const { id } = req.params;
    console.log(`📖 Obteniendo publicación con ID: ${id}`);

    // 🔥 CONSULTA MEJORADA con rol
    const [publicaciones] = await db.query(`
      SELECT 
        p.ID_publicacion,
        p.titulo,
        p.contenido,
        UNIX_TIMESTAMP(p.fecha_creacion) as fecha_creacion_timestamp,
        p.fecha_creacion,
        p.fecha_ultima_edicion,
        p.ID_usuario,
        p.ID_estado_publicacion,
        u.nombre,
        u.apellido,
        u.programa,
        u.ID_rol,
        r.nombre as rol_nombre
      FROM publicacion p
      INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
      LEFT JOIN rol r ON u.ID_rol = r.ID_rol
      WHERE p.ID_publicacion = ?
    `, [id]);

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada"
      });
    }

    const publicacion = publicaciones[0];
    console.log(`✅ Publicación encontrada: ${publicacion.titulo}`);

    try {
      const [etiquetas] = await db.query(`
        SELECT e.ID_etiqueta, e.nombre
        FROM publicacion_etiqueta pe
        INNER JOIN etiqueta e ON pe.ID_etiqueta = e.ID_etiqueta
        WHERE pe.ID_publicacion = ?
      `, [id]);

      publicacion.etiquetas = etiquetas;

      const ahoraTimestamp = Math.floor(Date.now() / 1000);
      const diferenciaSegundos = ahoraTimestamp - publicacion.fecha_creacion_timestamp;
      const diferenciaMinutos = diferenciaSegundos / 60;
      
      publicacion.puedeEditar = diferenciaMinutos <= 15;
      publicacion.minutosRestantes = Math.max(0, Math.floor(15 - diferenciaMinutos));
      publicacion.rol = publicacion.rol_nombre || 'usuario'; // 🔥 Agregar rol

    } catch (etiquetaError) {
      console.warn(`⚠️ Error al obtener etiquetas:`, etiquetaError.message);
      publicacion.etiquetas = [];
      publicacion.puedeEditar = false;
      publicacion.minutosRestantes = 0;
      publicacion.rol = 'usuario';
    }

    res.json({
      success: true,
      publicacion
    });

  } catch (error) {
    console.error("❌ Error al obtener publicación:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener la publicación",
      error: error.message
    });
  }
}

/**
 * Controlador para editar una publicación existente.
 */
async function editarPublicacion(req, res) {
  try {
    const { id } = req.params;
    const { titulo, contenido, etiquetas } = req.body;
    const ID_usuario = req.usuario.id;

    console.log(`✏️ Editando publicación ${id} por usuario ${ID_usuario}`);

    const [publicaciones] = await db.query(
      'SELECT *, UNIX_TIMESTAMP(fecha_creacion) as fecha_creacion_timestamp FROM publicacion WHERE ID_publicacion = ? AND ID_usuario = ?',
      [id, ID_usuario]
    );

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada o no tienes permisos para editarla"
      });
    }

    // Verificar límite de tiempo
    const publicacion = publicaciones[0];
    const ahoraTimestamp = Math.floor(Date.now() / 1000);
    const diferenciaSegundos = ahoraTimestamp - publicacion.fecha_creacion_timestamp;
    const diferenciaMinutos = diferenciaSegundos / 60;

    console.log(`⏱️ Tiempo transcurrido: ${diferenciaMinutos.toFixed(2)} minutos`);

    if (diferenciaMinutos > 15) {
      return res.status(403).json({
        success: false,
        message: "No puedes editar esta publicación. El tiempo límite de edición (15 minutos) ha expirado.",
        tiempoTranscurrido: `${Math.floor(diferenciaMinutos)} minutos`
      });
    }

    if (titulo && (titulo.length < 5 || titulo.length > 100)) {
      return res.status(400).json({
        success: false,
        message: "El título debe tener entre 5 y 100 caracteres"
      });
    }

    if (contenido && contenido.length < 10) {
      return res.status(400).json({
        success: false,
        message: "El contenido debe tener al menos 10 caracteres"
      });
    }

    await db.query(
      'UPDATE publicacion SET titulo = ?, contenido = ?, fecha_ultima_edicion = NOW() WHERE ID_publicacion = ?',
      [titulo || publicaciones[0].titulo, contenido || publicaciones[0].contenido, id]
    );

    console.log(`✅ Publicación ${id} actualizada`);

    if (etiquetas && Array.isArray(etiquetas)) {
      try {
        await db.query('DELETE FROM publicacion_etiqueta WHERE ID_publicacion = ?', [id]);
        
        for (const ID_etiqueta of etiquetas) {
          await db.query(
            'INSERT INTO publicacion_etiqueta (ID_publicacion, ID_etiqueta) VALUES (?, ?)',
            [id, ID_etiqueta]
          );
        }
        console.log(`🏷️ Etiquetas actualizadas para publicación ${id}`);
      } catch (etiquetaError) {
        console.warn("⚠️ Error al actualizar etiquetas:", etiquetaError.message);
      }
    }

    res.json({
      success: true,
      message: "Publicación actualizada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error al editar publicación:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al editar la publicación",
      error: error.message
    });
  }
}

/**
 * Controlador para eliminar una publicación.
 */
async function eliminarPublicacion(req, res) {
  try {
    const { id } = req.params;
    const ID_usuario = req.usuario.id;
    const esAdmin = req.usuario.rol === 1;

    console.log(`🗑️ Eliminando publicación ${id} por usuario ${ID_usuario}`);

    const [publicaciones] = await db.query(
      'SELECT * FROM publicacion WHERE ID_publicacion = ?',
      [id]
    );

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada"
      });
    }

    if (publicaciones[0].ID_usuario !== ID_usuario && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar esta publicación"
      });
    }

    await db.query('DELETE FROM publicacion_etiqueta WHERE ID_publicacion = ?', [id]);
    console.log(`🏷️ Etiquetas eliminadas para publicación ${id}`);

    await db.query('DELETE FROM publicacion WHERE ID_publicacion = ?', [id]);
    console.log(`✅ Publicación ${id} eliminada correctamente`);

    res.json({
      success: true,
      message: "Publicación eliminada exitosamente"
    });

  } catch (error) {
    console.error("❌ Error al eliminar publicación:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al eliminar la publicación",
      error: error.message
    });
  }
}

export const methods = {
  crearPublicacion,
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  editarPublicacion,
  eliminarPublicacion
};