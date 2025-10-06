import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../database/db.js';

dotenv.config();

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

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

    const [usuarios] = await db.query(
      'SELECT * FROM usuario WHERE documento = ?',
      [documento]
    );

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
        rol: usuario.ID_rol
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
        rol: usuario.ID_rol
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
}

async function register(req, res) {
  try {
    const { documento, nombres, apellidos, correo, programa, contrasena, confirmar_contrasena } = req.body;

    if (!documento || !nombres || !apellidos || !correo || !programa || !contrasena || !confirmar_contrasena) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios"
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

    const contrasenaHash = await bcryptjs.hash(contrasena, 10);
    const fechaRegistro = new Date().toISOString().split('T')[0];

    const [resultado] = await db.query(
      'INSERT INTO usuario (documento, nombre, apellido, correo, programa, contresena, ID_rol, ID_estado_cuenta, fecha_registro, `imagen perfil`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [documento, nombres, apellidos, correo, programa, contrasenaHash, 2, 1, fechaRegistro, '']
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      usuario: {
        id: resultado.insertId,
        documento,
        nombres,
        apellidos,
        correo,
        programa
      }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
}

export const methods = {
  login,
  register
};