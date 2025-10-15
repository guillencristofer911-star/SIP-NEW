import connection from "../config/db.js";

// 🗑️ Eliminar una publicación propia
export const eliminarPublicacion = (req, res) => {
  const { id_publicacion, id_usuario } = req.body;

  if (!id_publicacion || !id_usuario) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos: id_publicacion o id_usuario",
    });
  }

  const query = "DELETE FROM publicaciones WHERE id_publicacion = ? AND id_usuario = ?";

  connection.query(query, [id_publicacion, id_usuario], (err, result) => {
    if (err) {
      console.error("💥 Error al eliminar publicación:", err);
      return res.status(500).json({
        success: false,
        message: "Error interno al eliminar publicación",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una publicación con ese ID o no pertenece al usuario",
      });
    }

    res.json({
      success: true,
      message: "Publicación eliminada correctamente",
    });
  });
};

