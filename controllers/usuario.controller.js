import db from "../database/db.js"; 

export const cambiarCorreo = async (req, res) => {
  const { correoActual, nuevoCorreo } = req.body;
  const usuarioId = req.usuario.id; // 
  try {
    // Verificar correo actual
    const [rows] = await db.query(
      "SELECT correo FROM usuario WHERE ID_usuario = ?",
      [usuarioId]
    );

    if (!rows.length || rows[0].correo !== correoActual) {
      return res.status(400).json({
        success: false,
        message: "El correo actual no es correcto"
      });
    }

    // Verificar que el nuevo correo no esté en uso
    const [existe] = await db.query(
      "SELECT ID_usuario FROM usuario WHERE correo = ?",
      [nuevoCorreo]
    );

    if (existe.length) {
      return res.status(400).json({
        success: false,
        message: "El nuevo correo ya está registrado"
      });
    }

    // Actualizar
    await db.query(
      "UPDATE usuario SET correo = ? WHERE ID_usuario = ?",
      [nuevoCorreo, usuarioId]
    );

    res.json({
      success: true,
      message: "Correo actualizado correctamente"
    });

  } catch (error) {
    console.error("Error cambiando correo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};
