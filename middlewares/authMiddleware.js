import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware para verificar el token JWT en las solicitudes protegidas.
 * Si el token es válido, agrega la información del usuario al objeto req.
 * Si el token es inválido, expirado o no proporcionado, responde con el error correspondiente.
 */
export const verificarToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado. Token no proporcionado"
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario al request
    req.usuario = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expirado. Por favor inicia sesión nuevamente"
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Token inválido"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al verificar token"
    });
  }
};

/**
 * Middleware para verificar si el usuario autenticado tiene uno de los roles permitidos.
 * @param  {...any} rolesPermitidos - Lista de roles permitidos para acceder al recurso.
 * Si el usuario no tiene el rol adecuado, responde con error 403.
 */
export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a este recurso"
      });
    }

    next();
  };
};

/**
 * Middleware para verificar si el usuario autenticado es administrador (ID_rol = 1).
 * Si no es admin, responde con error 403.
 */
export const verificarAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: "Usuario no autenticado"
    });
  }

  if (req.usuario.rol !== 1) {
    return res.status(403).json({
      success: false,
      message: "Acceso restringido a administradores"
    });
  }

  next();
};