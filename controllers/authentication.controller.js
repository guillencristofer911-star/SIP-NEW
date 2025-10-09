import pool from "../database/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==================== LOGIN ====================
async function login(req, res) {
  try {
    const { documento, password } = req.body;

    if (!documento || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, ingresa documento y contraseña."
      });
    }

    // 🔹 Buscar por documento
    const [rows] = await pool.query(
      "SELECT * FROM usuario WHERE documento = ?",
      [documento]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Documento o contraseña incorrectos."
      });
    }

    const usuario = rows[0];

    // 🔹 Validar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.contresena);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: "Documento o contraseña incorrectos."
      });
    }

    // 🔹 Crear token JWT
    const token = jwt.sign(
      {
        ID_usuario: usuario.ID_usuario,
        documento: usuario.documento,
        ID_rol: usuario.ID_rol
      },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.ID_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        documento: usuario.documento,
        programa: usuario.programa,
        rol: usuario.ID_rol
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor.",
      error: error.message
    });
  }
}

// ==================== REGISTRO ====================
async function register(req, res) {
  try {
    const { documento, nombre, apellido, correo, programa, password } = req.body;

    if (!documento || !nombre || !apellido || !correo || !programa || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, completa todos los campos."
      });
    }

    const [existe] = await pool.query(
      "SELECT * FROM usuario WHERE documento = ?",
      [documento]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El documento ya está registrado."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO usuario 
      (documento, nombre, apellido, correo, programa, contresena, ID_rol, ID_estado_cuenta, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, 2, 1, CURDATE())`,
      [documento, nombre, apellido, correo, programa, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente."
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor.",
      error: error.message
    });
  }
}

// ==================== CAMBIAR CONTRASEÑA ====================
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.usuario?.ID_usuario;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Debes ingresar la contraseña actual y la nueva."
      });
    }

    const [rows] = await pool.query(
      "SELECT contresena FROM usuario WHERE ID_usuario = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado."
      });
    }

    const passwordValida = await bcrypt.compare(oldPassword, rows[0].contresena);
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE usuario SET contresena = ? WHERE ID_usuario = ?",
      [hashedPassword, userId]
    );

    return res.json({
      success: true,
      message: "Contraseña actualizada correctamente."
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor al cambiar la contraseña.",
      error: error.message
    });
  }
}

// ==================== EXPORTAR MÉTODOS ====================
export const methods = {
  login,
  register,
  changePassword
};
