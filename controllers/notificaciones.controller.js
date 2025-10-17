import db from "../database/db.js";

// ====================== CREAR NOTIFICACIÓN ======================
export const crearNotificacion = async (idUsuarioDestino, contenido) => {
  try {
    await db.query(
      `INSERT INTO Notificacion 
       (ID_Usuario_Destino, ID_Tipo_Notificacion, Contenido, ID_Estado_Notificacion, Fecha_Envio)
       VALUES (?, ?, ?, ?, NOW())`,
      [idUsuarioDestino, 1, contenido, 1] // tipo 1 = genérico, estado 1 = no leída
    );
    console.log(`🔔 Notificación enviada al usuario ${idUsuarioDestino}`);
  } catch (error) {
    console.error("❌ Error al crear la notificación:", error);
  }
};

// ====================== OBTENER NOTIFICACIONES ======================
export const obtenerNotificaciones = async (req, res) => {
  try {
    const idUsuario = req.usuario?.id || req.params.idUsuario;

    if (!idUsuario)
      return res.status(400).json({
        success: false,
        message: "Falta el ID del usuario.",
      });

    const [notificaciones] = await db.query(
      `SELECT n.*, 
              tn.Nombre_Tipo AS tipo,
              en.Nombre_Estado AS estado
       FROM Notificacion n
       LEFT JOIN Tipo_Notificacion tn ON n.ID_Tipo_Notificacion = tn.ID_Tipo_Notificacion
       LEFT JOIN Estado_Notificacion en ON n.ID_Estado_Notificacion = en.ID_Estado_Notificacion
       WHERE n.ID_Usuario_Destino = ?
       ORDER BY n.Fecha_Envio DESC`,
      [idUsuario]
    );

    res.json({
      success: true,
      notificaciones,
    });
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las notificaciones.",
    });
  }
};

// ====================== MARCAR COMO LEÍDA ======================
export const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({
        success: false,
        message: "Falta el ID de la notificación.",
      });

    await db.query(
      `UPDATE Notificacion 
       SET ID_Estado_Notificacion = 2 
       WHERE ID_Notificacion = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "✅ Notificación marcada como leída.",
    });
  } catch (error) {
    console.error("❌ Error al actualizar notificación:", error);
    res.status(500).json({
      success: false,
      message: "Error al marcar la notificación como leída.",
    });
  }
};

// ====================== ELIMINAR NOTIFICACIÓN ======================
export const eliminarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({
        success: false,
        message: "Falta el ID de la notificación.",
      });

    await db.query(`DELETE FROM Notificacion WHERE ID_Notificacion = ?`, [id]);

    res.json({
      success: true,
      message: "🗑️ Notificación eliminada correctamente.",
    });
  } catch (error) {
    console.error("❌ Error al eliminar notificación:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la notificación.",
    });
  }
};
