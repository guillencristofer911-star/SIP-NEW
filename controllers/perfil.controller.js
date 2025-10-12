import pool from '../database/db.js';

export const methods = {
    // Obtener datos del perfil del usuario
    obtenerPerfil: async (req, res) => {
        try {
            const userId = req.usuario.id; // Del token JWT

            console.log('📋 Obteniendo perfil del usuario:', userId);

            // Obtener datos del usuario
            const [usuarios] = await pool.execute(`
                SELECT 
                    u.ID_usuario,
                    u.documento,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    u.programa,
                    u.imagen_perfil,
                    u.fecha_registro,
                    u.ID_rol,
                    r.nombre as rol_nombre
                FROM usuario u
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE u.ID_usuario = ? AND u.ID_estado_cuenta = 1
            `, [userId]);

            if (usuarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const usuario = usuarios[0];

            res.json({
                success: true,
                usuario: {
                    id: usuario.ID_usuario,
                    documento: usuario.documento,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
                    correo: usuario.correo,
                    programa: usuario.programa,
                    rol: usuario.rol_nombre,
                    imagen_perfil: usuario.imagen_perfil,
                    fecha_registro: usuario.fecha_registro
                }
            });

        } catch (error) {
            console.error('❌ Error al obtener perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar el perfil'
            });
        }
    },

    // Obtener historial de proyectos del usuario
    obtenerHistorialProyectos: async (req, res) => {
        try {
            const userId = req.usuario.id;

            console.log('📚 Obteniendo historial de proyectos del usuario:', userId);

            const [proyectos] = await pool.execute(`
                SELECT 
                    p.ID_proyecto,
                    p.nombre as titulo,
                    p.descripcion,
                    p.github_url,
                    p.documento_pdf,
                    p.imagenes,
                    p.fecha_creacion,
                    p.fecha_ultima_edicion,
                    p.programa_autor,
                    p.rol_autor,
                    p.estado,
                    u.nombre as nombre_autor,
                    u.apellido as apellido_autor,
                    r.nombre as rol_usuario
                FROM proyecto p
                JOIN usuario u ON p.ID_usuario = u.ID_usuario
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE p.ID_usuario = ? AND p.estado = 'activo'
                ORDER BY p.fecha_creacion DESC
            `, [userId]);

            const proyectosFormateados = proyectos.map(proyecto => ({
                id: proyecto.ID_proyecto,
                tipo: 'proyecto',
                titulo: proyecto.titulo,
                descripcion: proyecto.descripcion,
                programa: proyecto.programa_autor,
                rol: proyecto.rol_usuario || proyecto.rol_autor,
                fecha_creacion: proyecto.fecha_creacion,
                fecha_ultima_edicion: proyecto.fecha_ultima_edicion,
                autor: `${proyecto.nombre_autor} ${proyecto.apellido_autor}`,
                imagenes: proyecto.imagenes ? JSON.parse(proyecto.imagenes) : [],
                github_url: proyecto.github_url,
                documento_pdf: proyecto.documento_pdf
            }));

            console.log(`✅ Se encontraron ${proyectosFormateados.length} proyectos`);

            res.json({
                success: true,
                proyectos: proyectosFormateados
            });

        } catch (error) {
            console.error('❌ Error al obtener historial de proyectos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar el historial de proyectos'
            });
        }
    },

    // Obtener historial de publicaciones del usuario
    obtenerHistorialPublicaciones: async (req, res) => {
        try {
            const userId = req.usuario.id;

            console.log('📝 Obteniendo historial de publicaciones del usuario:', userId);

            const [publicaciones] = await pool.execute(`
                SELECT 
                    p.ID_publicacion,
                    p.titulo,
                    p.contenido,
                    p.fecha_creacion,
                    p.fecha_ultima_edicion,
                    UNIX_TIMESTAMP(p.fecha_creacion) as fecha_creacion_timestamp,
                    u.nombre,
                    u.apellido,
                    u.programa,
                    u.ID_rol,
                    r.nombre as rol_nombre
                FROM publicacion p
                INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE p.ID_usuario = ? AND p.ID_estado_publicacion = 1
                ORDER BY p.fecha_creacion DESC
            `, [userId]);

            // Obtener tiempo actual del servidor MySQL
            const [tiempoServidor] = await pool.query('SELECT UNIX_TIMESTAMP() as ahora');
            const ahoraTimestamp = tiempoServidor[0].ahora;

            const publicacionesFormateadas = publicaciones.map(pub => {
                const diferenciaSegundos = ahoraTimestamp - pub.fecha_creacion_timestamp;
                const diferenciaMinutos = diferenciaSegundos / 60;
                
                return {
                    id: pub.ID_publicacion,
                    tipo: 'publicacion',
                    titulo: pub.titulo,
                    contenido: pub.contenido,
                    programa: pub.programa,
                    rol: pub.rol_nombre,
                    fecha_creacion: pub.fecha_creacion,
                    fecha_ultima_edicion: pub.fecha_ultima_edicion,
                    autor: `${pub.nombre} ${pub.apellido}`,
                    puedeEditar: diferenciaMinutos <= 15,
                    minutosRestantes: Math.max(0, Math.floor(15 - diferenciaMinutos))
                };
            });

            console.log(`✅ Se encontraron ${publicacionesFormateadas.length} publicaciones`);

            res.json({
                success: true,
                publicaciones: publicacionesFormateadas
            });

        } catch (error) {
            console.error('❌ Error al obtener historial de publicaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar el historial de publicaciones'
            });
        }
    },

    // Obtener historial completo (proyectos + publicaciones)
    obtenerHistorialCompleto: async (req, res) => {
        try {
            const userId = req.usuario.id;

            console.log('🔍 Obteniendo historial completo del usuario:', userId);

            // Obtener proyectos
            const [proyectos] = await pool.execute(`
                SELECT 
                    p.ID_proyecto as id,
                    'proyecto' as tipo,
                    p.nombre as titulo,
                    p.descripcion,
                    p.programa_autor as programa,
                    p.rol_autor as rol,
                    p.fecha_creacion,
                    p.fecha_ultima_edicion,
                    p.imagenes,
                    p.github_url,
                    p.documento_pdf,
                    CONCAT(u.nombre, ' ', u.apellido) as autor
                FROM proyecto p
                JOIN usuario u ON p.ID_usuario = u.ID_usuario
                WHERE p.ID_usuario = ? AND p.estado = 'activo'
            `, [userId]);

            // Obtener publicaciones
            const [publicaciones] = await pool.execute(`
                SELECT 
                    p.ID_publicacion as id,
                    'publicacion' as tipo,
                    p.titulo,
                    p.contenido as descripcion,
                    u.programa,
                    r.nombre as rol,
                    p.fecha_creacion,
                    p.fecha_ultima_edicion,
                    UNIX_TIMESTAMP(p.fecha_creacion) as fecha_creacion_timestamp,
                    CONCAT(u.nombre, ' ', u.apellido) as autor
                FROM publicacion p
                INNER JOIN usuario u ON p.ID_usuario = u.ID_usuario
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE p.ID_usuario = ? AND p.ID_estado_publicacion = 1
            `, [userId]);

            // Obtener tiempo actual del servidor MySQL
            const [tiempoServidor] = await pool.query('SELECT UNIX_TIMESTAMP() as ahora');
            const ahoraTimestamp = tiempoServidor[0].ahora;

            // Formatear publicaciones con información de edición
            const publicacionesFormateadas = publicaciones.map(pub => {
                const diferenciaSegundos = ahoraTimestamp - pub.fecha_creacion_timestamp;
                const diferenciaMinutos = diferenciaSegundos / 60;
                
                return {
                    ...pub,
                    puedeEditar: diferenciaMinutos <= 15,
                    minutosRestantes: Math.max(0, Math.floor(15 - diferenciaMinutos))
                };
            });

            // Formatear proyectos
            const proyectosFormateados = proyectos.map(proy => ({
                ...proy,
                imagenes: proy.imagenes ? JSON.parse(proy.imagenes) : []
            }));

            // Combinar y ordenar por fecha
            const historialCompleto = [...proyectosFormateados, ...publicacionesFormateadas]
                .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

            console.log(`✅ Historial completo: ${proyectosFormateados.length} proyectos + ${publicacionesFormateadas.length} publicaciones`);

            res.json({
                success: true,
                historial: historialCompleto,
                estadisticas: {
                    totalProyectos: proyectosFormateados.length,
                    totalPublicaciones: publicacionesFormateadas.length,
                    total: historialCompleto.length
                }
            });

        } catch (error) {
            console.error('❌ Error al obtener historial completo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar el historial'
            });
        }
    }
};