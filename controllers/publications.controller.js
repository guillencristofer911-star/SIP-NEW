import db from '../database/db.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Controlador para crear una nueva publicación.
 * Valida los datos y almacena la publicación en la base de datos.
 */
async function crearPublicacion(req, res) {
  try {
    const { titulo, contenido, etiquetas } = req.body;
    const ID_usuario = req.usuario.id;

    console.log(' Intentando crear publicación:', { titulo, contenido, ID_usuario });

    // Validar campos obligatorios
    if (!titulo || !contenido) {
      return res.status(400).json({
        success: false,
        message: "El título y contenido son obligatorios"
      });
    }

    // Validar longitud del título
    if (titulo.length < 5 || titulo.length > 100) {
      return res.status(400).json({
        success: false,
        message: "El título debe tener entre 5 y 100 caracteres"
      });
    }

    // Validar longitud del contenido
    if (contenido.length < 10) {
      return res.status(400).json({
        success: false,
        message: "El contenido debe tener al menos 10 caracteres"
      });
    }

    //  GUARDAR FECHA COMPLETA CON HORA (DATETIME)
    const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const ID_estado_publicacion = 1;

    console.log(' Fecha de creación:', fechaActual);


    // INSERTAR USANDO NOW() DE MYSQL PARA HORA EXACTA
    const [resultado] = await db.query(
      'INSERT INTO publicacion (ID_usuario, titulo, contenido, fecha_creacion, fecha_ultima_edicion, ID_estado_publicacion) VALUES (?, ?, ?, NOW(), NOW(), ?)',
      [ID_usuario, titulo, contenido, ID_estado_publicacion]
    );

    console.log('Publicación creada con timestamp actual de MySQL');

    const ID_publicacion = resultado.insertId;
    console.log(' Publicación creada con ID:', ID_publicacion);

    // Si hay etiquetas, asociarlas a la publicación
    if (etiquetas && Array.isArray(etiquetas) && etiquetas.length > 0) {
      try {
        for (const ID_etiqueta of etiquetas) {
          await db.query(
            'INSERT INTO publicacion_etiqueta (ID_publicacion, ID_etiqueta) VALUES (?, ?)',
            [ID_publicacion, ID_etiqueta]
          );
        }
        console.log(' Etiquetas asociadas correctamente');
      } catch (etiquetaError) {
        console.warn(" Error al insertar etiquetas (no crítico):", etiquetaError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Publicación creada exitosamente",
      publicacion: {
        id: ID_publicacion,
        titulo,
        contenido,
        fecha_creacion: fechaActual,
        etiquetas
      }
    });

  } catch (error) {
    console.error(" Error al crear publicación:", error);
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
    console.log('Obteniendo todas las publicaciones...');

    const [publicaciones] = await db.query(`
      SELECT 
        p.ID_publicacion,
        p.titulo,
        p.contenido,
        p.fecha_creacion,
        p.fecha_ultima_edicion,
        p.ID_usuario,
        u.nombre,
        u.apellido,
        u.programa,
        ep.estado
      FROM publicacion p
      INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
      LEFT JOIN estado_publicacion ep ON p.ID_estado_publicacion = ep.ID_estado_publicacion
      WHERE ep.estado = 'activo' OR ep.estado = 'Activo' OR ep.estado IS NULL
      ORDER BY p.fecha_creacion DESC
    `);

    console.log(` Se encontraron ${publicaciones.length} publicaciones`);

    // Calcular tiempo de edición para cada publicación
    const ahora = new Date();
    
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

        // Calcular tiempo restante para edición
        const fechaCreacion = new Date(pub.fecha_creacion);
        const diferenciaMs = ahora.getTime() - fechaCreacion.getTime();
        const diferenciaMinutos = diferenciaMs / (1000 * 60);
        const minutosRestantes = Math.max(0, Math.floor(15 - diferenciaMinutos));
        
        pub.puedeEditar = diferenciaMinutos <= 15;
        pub.minutosRestantes = minutosRestantes;

        console.log(` Publicación ${pub.ID_publicacion}: ${minutosRestantes} min restantes (puede editar: ${pub.puedeEditar})`);
        
      } catch (etiquetaError) {
        console.warn(` Error al obtener etiquetas para publicación ${pub.ID_publicacion}:`, etiquetaError.message);
        pub.etiquetas = [];
        pub.puedeEditar = false;
        pub.minutosRestantes = 0;
      }
    }

    res.json({
      success: true,
      publicaciones
    });

  } catch (error) {
    console.error(" Error al obtener publicaciones:", error);
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
    console.log(` Obteniendo publicación con ID: ${id}`);

    const [publicaciones] = await db.query(`
      SELECT 
        p.ID_publicacion,
        p.titulo,
        p.contenido,
        p.fecha_creacion,
        p.fecha_ultima_edicion,
        p.ID_usuario,
        u.nombre,
        u.apellido,
        u.programa,
        ep.estado
      FROM publicacion p
      INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
      LEFT JOIN estado_publicacion ep ON p.ID_estado_publicacion = ep.ID_estado_publicacion
      WHERE p.ID_publicacion = ?
    `, [id]);

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada"
      });
    }

    const publicacion = publicaciones[0];
    console.log(` Publicación encontrada: ${publicacion.titulo}`);

    // Obtener etiquetas
    try {
      const [etiquetas] = await db.query(`
        SELECT e.ID_etiqueta, e.nombre
        FROM publicacion_etiqueta pe
        INNER JOIN etiqueta e ON pe.ID_etiqueta = e.ID_etiqueta
        WHERE pe.ID_publicacion = ?
      `, [id]);

      publicacion.etiquetas = etiquetas;

      // Calcular tiempo restante
      const ahora = new Date();
      const fechaCreacion = new Date(publicacion.fecha_creacion);
      const diferenciaMs = ahora.getTime() - fechaCreacion.getTime();
      const diferenciaMinutos = diferenciaMs / (1000 * 60);
      
      publicacion.puedeEditar = diferenciaMinutos <= 15;
      publicacion.minutosRestantes = Math.max(0, Math.floor(15 - diferenciaMinutos));

    } catch (etiquetaError) {
      console.warn(` Error al obtener etiquetas:`, etiquetaError.message);
      publicacion.etiquetas = [];
      publicacion.puedeEditar = false;
      publicacion.minutosRestantes = 0;
    }

    res.json({
      success: true,
      publicacion
    });

  } catch (error) {
    console.error(" Error al obtener publicación:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al obtener la publicación",
      error: error.message
    });
  }
}

/**
 * Controlador para editar una publicación existente.
 * RESTRICCIÓN: Solo se puede editar dentro de los primeros 15 minutos después de creada.
 */
async function editarPublicacion(req, res) {
  try {
    const { id } = req.params;
    const { titulo, contenido, etiquetas } = req.body;
    const ID_usuario = req.usuario.id;

    console.log(`Editando publicación ${id} por usuario ${ID_usuario}`);

    // Verificar que la publicación existe y pertenece al usuario
    const [publicaciones] = await db.query(
      'SELECT * FROM publicacion WHERE ID_publicacion = ? AND ID_usuario = ?',
      [id, ID_usuario]
    );

    if (publicaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada o no tienes permisos para editarla"
      });
    }

    //  VERIFICAR LÍMITE DE TIEMPO (15 minutos)
    const publicacion = publicaciones[0];
    const fechaCreacion = new Date(publicacion.fecha_creacion);
    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - fechaCreacion.getTime();
    const diferenciaMinutos = diferenciaMs / (1000 * 60);

    console.log(` Tiempo transcurrido: ${diferenciaMinutos.toFixed(2)} minutos`);
    console.log(` Fecha creación: ${fechaCreacion.toISOString()}`);
    console.log(` Fecha actual: ${ahora.toISOString()}`);

    if (diferenciaMinutos > 15) {
      return res.status(403).json({
        success: false,
        message: "No puedes editar esta publicación. El tiempo límite de edición (15 minutos) ha expirado.",
        tiempoTranscurrido: `${Math.floor(diferenciaMinutos)} minutos`
      });
    }

    // Validar campos si se proporcionan
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

    //  USAR FECHA COMPLETA CON HORA
    const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Actualizar publicación
    await db.query(
      'UPDATE publicacion SET titulo = ?, contenido = ?, fecha_ultima_edicion = ? WHERE ID_publicacion = ?',
      [titulo || publicaciones[0].titulo, contenido || publicaciones[0].contenido, fechaActual, id]
    );

    console.log(`Publicación ${id} actualizada`);

    // Si hay etiquetas, actualizar
    if (etiquetas && Array.isArray(etiquetas)) {
      try {
        await db.query('DELETE FROM publicacion_etiqueta WHERE ID_publicacion = ?', [id]);
        
        for (const ID_etiqueta of etiquetas) {
          await db.query(
            'INSERT INTO publicacion_etiqueta (ID_publicacion, ID_etiqueta) VALUES (?, ?)',
            [id, ID_etiqueta]
          );
        }
        console.log(` Etiquetas actualizadas para publicación ${id}`);
      } catch (etiquetaError) {
        console.warn(" Error al actualizar etiquetas:", etiquetaError.message);
      }
    }

    res.json({
      success: true,
      message: "Publicación actualizada exitosamente"
    });

  } catch (error) {
    console.error(" Error al editar publicación:", error);
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

    // Verificar que la publicación existe
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

    // Verificar permisos: solo el autor o un admin pueden eliminar
    if (publicaciones[0].ID_usuario !== ID_usuario && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar esta publicación"
      });
    }

    // Eliminar etiquetas asociadas
    await db.query('DELETE FROM publicacion_etiqueta WHERE ID_publicacion = ?', [id]);
    console.log(` Etiquetas eliminadas para publicación ${id}`);

    // Eliminar publicación
    await db.query('DELETE FROM publicacion WHERE ID_publicacion = ?', [id]);
    console.log(` Publicación ${id} eliminada correctamente`);

    res.json({
      success: true,
      message: "Publicación eliminada exitosamente"
    });

  } catch (error) {
    console.error(" Error al eliminar publicación:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al eliminar la publicación",
      error: error.message
    });
  }
}

// Exportar los métodos del controlador
export const methods = {
  crearPublicacion,
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  editarPublicacion,
  eliminarPublicacion
};