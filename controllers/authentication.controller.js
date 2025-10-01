import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../database/db.js';

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
  'SELECT * FROM usuario WHERE correo = ?',  // <- cambiar aquí
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
  'SELECT * FROM usuario WHERE correo = ? OR documento = ?',  // <- cambiar aquí
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
// Insertar usuario en la base de datos
const [resultado] = await db.query(
  'INSERT INTO usuario (documento, nombre, apellido, correo, programa, contresena, ID_rol, ID_estado_cuenta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  [documento, nombres, apellidos, correo, programa, contrasenaHash, 2, 1]    // 2 = rol de usuario normal, ajusta según tu tabla
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
