import db from "../database/db.js"; // usa tu conexión existente si ya tienes una

export const methods = {
  // ✅ Agregar una publicación a favoritos
  async agregarFavorito(req, res) {
    try {
      const { ID_usuario, ID_publicacion } = req.body;

      if (!ID_usuario || !ID_publicacion) {
        return res.status(400).json({ success: false, message: "Faltan datos." });
      }

      const fecha = new Date().toISOString().split("T")[0];

      const [result] = await db.query(
        "INSERT INTO favoritos (ID_usuario, ID_publicacion, fecha_marcado) VALUES (?, ?, ?)",
        [ID_usuario, ID_publicacion, fecha]
      );

      res.json({ success: true, message: "Publicación agregada a favoritos." });
    } catch (err) {
      console.error("Error al agregar favorito:", err);
      res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
  },

  // ✅ Obtener los favoritos de un usuario
  async obtenerFavoritos(req, res) {
    try {
      const { ID_usuario } = req.params;
      const [rows] = await db.query(
        `SELECT p.* FROM favoritos f 
         JOIN publicaciones p ON f.ID_publicacion = p.id 
         WHERE f.ID_usuario = ?`,
        [ID_usuario]
      );

      res.json(rows);
    } catch (err) {
      console.error("Error al obtener favoritos:", err);
      res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
  },

  // ✅ Quitar de favoritos (opcional)
  async eliminarFavorito(req, res) {
    try {
      const { ID_usuario, ID_publicacion } = req.body;

      await db.query(
        "DELETE FROM favoritos WHERE ID_usuario = ? AND ID_publicacion = ?",
        [ID_usuario, ID_publicacion]
      );

      res.json({ success: true, message: "Eliminado de favoritos." });
    } catch (err) {
      console.error("Error al eliminar favorito:", err);
      res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
  }
};
