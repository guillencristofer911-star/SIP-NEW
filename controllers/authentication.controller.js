import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../database/db.js';

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
    const { documento, contrasena } = req.body;

    if (!documento || !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Documento y contraseña son obligatorios"
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

    if (usuarios.length === 0) {
      recordFailedAttempt(documento);
      return res.status(401).json({
        success: false,
        message: "Documento o contraseña incorrectos"
      });
    }

    const usuario = usuarios[0];

    if (usuario.ID_estado_cuenta !== 1) {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta está inactiva. Contacta al administrador"
      });
    }

    const contrasenaValida = await bcryptjs.compare(contrasena, usuario.contresena);

    if (!contrasenaValida) {
      recordFailedAttempt(documento);
      return res.status(401).json({
        success: false,
        message: "Documento o contraseña incorrectos"
      });
    }

    resetLoginAttempts(documento);

    const token = jwt.sign(
      { 
        id: usuario.ID_usuario,
        documento: usuario.documento,
        correo: usuario.correo,
        rol: usuario.ID_rol,
        rol_nombre: usuario.rol_nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login exitoso",
      token,
      usuario: {
        id: usuario.ID_usuario,
        documento: usuario.documento,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        programa: usuario.programa,
        rol: usuario.ID_rol,
        rol_nombre: usuario.rol_nombre // 🔥 Enviar nombre del rol
      }
    });

  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
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
        message: "Todos los campos son obligatorios"
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

    if (!/^\d+$/.test(documento)) {
      return res.status(400).json({
        success: false,
        message: "El documento debe contener solo números"
      });
    }

    if (contrasena !== confirmar_contrasena) {
      return res.status(400).json({
        success: false,
        message: "Las contraseñas no coinciden"
      });
    }

    if (contrasena.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres"
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(contrasena)) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
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
  register
};