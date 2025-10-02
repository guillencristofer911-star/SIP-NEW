import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from '../database/db.js';
import sendEmail from '../utils/sendEmail.js'; // <- debes crear este archivo
dotenv.config();



async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Correo y contraseña son obligatorios"
      });
    }

    // Buscar usuario en la base de datos
    const [usuarios] = await db.query(
      'SELECT * FROM usuario WHERE correo = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos"
      });
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const contrasenaValida = await bcryptjs.compare(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos"
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        documento: usuario.documento,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        programa: usuario.programa
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

    // Validaciones
    if (!documento || !nombres || !apellidos || !correo || !programa || !contrasena || !confirmar_contrasena) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios"
      });
    }

    if (contrasena !== confirmar_contrasena) {
      return res.status(400).json({
        success: false,
        message: "Las contraseñas no coinciden"
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Verificar si el usuario ya existe
    const [usuariosExistentes] = await db.query(
      'SELECT * FROM usuario WHERE correo = ? OR documento = ?',
      [correo, documento]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        success: false,
        message: "El correo o documento ya están registrados"
      });
    }

    // Encriptar contraseña
    const contrasenaHash = await bcryptjs.hash(contrasena, 10);

    // Insertar usuario en la base de datos
    const [resultado] = await db.query(
      'INSERT INTO usuario (documento, nombre, apellido, correo, programa, contrasena, ID_rol, ID_estado_cuenta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [documento, nombres, apellidos, correo, programa, contrasenaHash, 2, 1]
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

/* FUNCIONES PARA RECUPERAR CONTRASEÑA*/

// 1. Enviar enlace de recuperación al correo
async function forgotPassword(req, res) {
  try {
    const { correo } = req.body;

    const [usuarios] = await db.query(
      'SELECT * FROM usuario WHERE correo = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.json({ success: true, message: "Si el correo existe, se enviará un enlace de recuperación." });
    }

    const usuario = usuarios[0];

    // Generar token y fecha de expiración
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expireDate = new Date(Date.now() + 3600000); // 1h

    // Guardar en BD
    await db.query(
      "UPDATE usuario SET reset_token = ?, reset_expire = ? WHERE id = ?",
      [tokenHash, expireDate, usuario.id]
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${usuario.correo}`;

    // Enviar email
    await sendEmail({
      to: usuario.correo,
      subject: "Recupera tu contraseña",
      text: `Entra a este enlace: ${resetUrl}`,
      html: `<a href="${resetUrl}">Recuperar contraseña</a>`
    });

    res.json({ success: true, message: "Si el correo existe, se enviará un enlace de recuperación." });

  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
}

// 2. Restablecer la contraseña con token
async function resetPassword(req, res) {
  try {
    const { token, correo, nuevaContrasena } = req.body;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [usuarios] = await db.query(
      "SELECT * FROM usuario WHERE correo = ? AND reset_token = ? AND reset_expire > NOW()",
      [correo, tokenHash]
    );

    if (usuarios.length === 0) {
      return res.status(400).json({ success: false, message: "Token inválido o expirado" });
    }

    const usuario = usuarios[0];
    const hashedPass = await bcryptjs.hash(nuevaContrasena, 10);

    await db.query(
      "UPDATE usuario SET contrasena = ?, reset_token = NULL, reset_expire = NULL WHERE id = ?",
      [hashedPass, usuario.id]
    );

    res.json({ success: true, message: "Contraseña cambiada con éxito" });

  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
}

export const methods = {
  login,
  register,
  forgotPassword,  
  resetPassword     
};
