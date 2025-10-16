import db from "../database/db.js";
import { crearNotificacion } from "./notificaciones.controller.js";

// ====================== CREAR RESPUESTA ======================
export const crearRespuesta = async (req, res) => {
  try {
    const { idPublicacion } = req.params;
    const { contenido } = req.body;
    const idUsuario = req.usuario.id; // viene del token

    // Insertar la respuesta
    await db.query(
      "INSERT INTO Respuesta_Publicacion (ID_Publicacion, ID_Usuario, Contenido, Fecha_Creacion) VALUES (?, ?, ?, NOW())",
      [idPublicacion, idUsuario, contenido]
    );

    // Buscar el autor original de la publicación
    const [publicacion] = await db.query(
      "SELECT ID_Usuario FROM Publicacion WHERE ID_Publicacion = ?",
      [idPublicacion]
    );

    if (publicacion.length > 0) {
      const idAutor = publicacion[0].ID_Usuario;

      // Evita que el autor se notifique a sí mismo
      if (idAutor !== idUsuario) {
        const mensaje = `Tu publicación ha recibido una nueva respuesta.`;
        await crearNotificacion(idAutor, mensaje);
      }
    }

    res.json({ success: true, message: "Respuesta creada correctamente" });
  } catch (error) {
    console.error("❌ Error al crear la respuesta:", error);
    res.status(500).json({ success: false, message: "Error al crear la respuesta" });
  }
};
