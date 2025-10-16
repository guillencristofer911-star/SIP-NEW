import db from "../database/db.js";

// ====================== CREAR NOTIFICACIÓN ======================
export const crearNotificacion = async (idUsuarioDestino, contenido) => {
  try {
    await db.query(
      "INSERT INTO Notificacion (ID_Usuario_Destino, ID_Tipo_Notificacion, Contenido, ID_Estado_Notificacion, Fecha_Envio) VALUES (?, ?, ?, ?, NOW())",
      [idUsuarioDestino, 1, contenido, 1]
    );
  } catch (error) {
    console.error("❌ Error al crear la notificación:", error);
  }
};

// ====================== OBTENER NOTIFICACIONES ======================
export const obtenerNotificaciones = async (req, res) => {
  try {
    const idUsuario = req.usuario.id; // viene del token
    const [notificaciones] = await db.query(
      "SELECT * FROM Notificacion WHERE ID_Usuario_Destino = ? ORDER BY Fecha_Envio DESC",
      [idUsuario]
    );
    res.json({ success: true, notificaciones });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al obtener notificaciones" });
  }
};

// ====================== MARCAR COMO LEÍDA ======================
export const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("UPDATE Notificacion SET ID_Estado_Notificacion = 2 WHERE ID_Notificacion = ?", [id]);
    res.json({ success: true, message: "Notificación marcada como leída" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al actualizar notificación" });
  }
};
