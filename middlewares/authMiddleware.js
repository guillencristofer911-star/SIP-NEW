import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware para verificar token JWT
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

// Middleware para verificar roles específicos
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

// Middleware para verificar que el usuario sea admin (ID_rol = 1)
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