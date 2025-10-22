import pool from "../database/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

/**
 * Verifica si un usuario puede intentar iniciar sesión según sus intentos previos.
 */
function checkLoginAttempts(documento) {
  const now = Date.now();
  const attempts = loginAttempts.get(documento) || { count: 0, lockedUntil: 0 };
  
  if (attempts.lockedUntil > now) {
    const minutesLeft = Math.ceil((attempts.lockedUntil - now) / 60000);
    return { allowed: false, minutesLeft };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCK_TIME;
    loginAttempts.set(documento, attempts);
    return { allowed: false, minutesLeft: 15 };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(documento) {
  const attempts = loginAttempts.get(documento) || { count: 0, lockedUntil: 0 };
  attempts.count++;
  loginAttempts.set(documento, attempts);
}

function resetLoginAttempts(documento) {
  loginAttempts.delete(documento);
}

/**
 * Controlador para el inicio de sesión de usuarios.
 */
async function login(req, res) {
  try {
    const { documento, password } = req.body;

    if (!documento || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, ingresa documento y contraseña."
      });
    }

    if (!/^\d+$/.test(documento)) {
      return res.status(400).json({
        success: false,
        message: "El documento debe contener solo números"
      });
    }

    const attemptCheck = checkLoginAttempts(documento);
    if (!attemptCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${attemptCheck.minutesLeft} minutos`
      });
    }

    // 🔥 CONSULTA MEJORADA: Obtener usuario con nombre de rol
    const [usuarios] = await db.query(`
      SELECT u.*, r.nombre as rol_nombre 
      FROM usuario u
      LEFT JOIN rol r ON u.ID_rol = r.ID_rol
      WHERE u.documento = ?
    `, [documento]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Documento o contraseña incorrectos."
      });
    }

    const usuario = rows[0];

    const passwordValida = await bcrypt.compare(password, usuario.contresena);
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: "Documento o contraseña incorrectos."
      });
    }

    const token = jwt.sign(
      {
        ID_usuario: usuario.ID_usuario,
        documento: usuario.documento,
        correo: usuario.correo,
        rol: usuario.ID_rol,
        rol_nombre: usuario.rol_nombre
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
        rol: usuario.ID_rol,
        rol_nombre: usuario.rol_nombre // 🔥 Enviar nombre del rol
      }
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor.",
      error: error.message
    });
  }
}

/**
 * Controlador para el registro de nuevos usuarios.
 * 🔥 ACTUALIZADO: Ahora acepta el rol seleccionado por el usuario
 */
async function register(req, res) {
  try {
    const { 
      documento, 
      nombres, 
      apellidos, 
      correo, 
      programa, 
      contrasena, 
      confirmar_contrasena,
      tipo // 🔥 NUEVO: recibe 'aprendiz' o 'egresado'
    } = req.body;

    // Validaciones básicas
    if (!documento || !nombres || !apellidos || !correo || !programa || !contrasena || !confirmar_contrasena || !tipo) {
      return res.status(400).json({
        success: false,
        message: "Por favor, completa todos los campos."
      });
    }

    // 🔥 Validar tipo de usuario
    if (!['aprendiz', 'egresado'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de usuario inválido. Debe ser 'aprendiz' o 'egresado'"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: "Formato de correo inválido"
      });
    }

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

    // Verificar si el usuario ya existe
    const [usuariosExistentes] = await db.query(
      'SELECT * FROM usuario WHERE correo = ? OR documento = ?',
      [correo, documento]
    );

    if (usuariosExistentes.length > 0) {
      const existe = usuariosExistentes[0];
      if (existe.correo === correo) {
        return res.status(409).json({
          success: false,
          message: "El correo ya está registrado"
        });
      } else {
        return res.status(409).json({
          success: false,
          message: "El documento ya está registrado"
        });
      }
    }

    // 🔥 Determinar ID_rol según el tipo seleccionado
    // 1 = admin, 2 = aprendiz, 3 = egresado
    const ID_rol = tipo === 'aprendiz' ? 2 : 3;

    const contrasenaHash = await bcryptjs.hash(contrasena, 10);

    // 🔥 INSERT MEJORADO: Incluye ID_rol
    const [resultado] = await db.query(
      `INSERT INTO usuario 
       (documento, nombre, apellido, correo, programa, contresena, ID_rol, ID_estado_cuenta, fecha_registro, imagen_perfil) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NULL)`,
      [documento, nombres, apellidos, correo, programa, contrasenaHash, ID_rol]
    );

    console.log(`✅ Usuario registrado: ID=${resultado.insertId}, Rol=${tipo} (ID_rol=${ID_rol})`);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      usuario: {
        id: resultado.insertId,
        documento,
        nombres,
        apellidos,
        correo,
        programa,
        rol: tipo
      }
    });
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor: " + error.message
    });
  }
}

export const methods = {
  login,
  register,
  changePassword
};
