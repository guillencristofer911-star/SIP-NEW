const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
    // Obtener el token del header de la petición
    const authHeader = req.header('Authorization');
    
    console.log('🔐 Headers recibidos:', req.headers);
    console.log('📨 Authorization header:', authHeader);
    
    // Verificar si existe el token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. No se proporcionó token.'
        });
    }
    
    // Extraer el token (quitar "Bearer ")
    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token recibido:', token);
    
    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, 'secreto_temporal_para_desarrollo');
        
        // Agregar la información del usuario a la petición
        req.user = decoded;
        console.log('✅ Token válido para usuario:', decoded);
        
        // Continuar con la siguiente función
        next();
    } catch (error) {
        console.log('❌ Error verificando token:', error.message);
        
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
    }
};

module.exports = { verifyToken };