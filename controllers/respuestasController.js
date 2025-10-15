import connection from "../config/db.js";

// 🗑️ Eliminar respuesta propia
export const eliminarRespuesta = (req, res) => {
  const { id_respuesta, id_usuario } = req.body;

  if (!id_respuesta || !id_usuario) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos: id_respuesta o id_usuario",
    });
  }

  const query = "DELETE FROM respuestas WHERE id_respuesta = ? AND id_usuario = ?";

  connection.query(query, [id_respuesta, id_usuario], (err, result) => {
    if (err) {
      console.error("💥 Error al eliminar respuesta:", err);
      return res.status(500).json({
        success: false,
        message: "Error interno al eliminar respuesta",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una respuesta con ese ID o no pertenece al usuario",
      });
    }

    res.json({
      success: true,
      message: "Respuesta eliminada correctamente",
    });
  });
};
