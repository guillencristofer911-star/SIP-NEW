import pool from '../database/db.js';

export const methods = {
crearProyecto: async (req, res) => {
    try {
        console.log('=== INICIANDO CREACIÓN DE PROYECTO ===');
        console.log('📦 Body recibido:', req.body);
        console.log('📎 Archivos recibidos:', req.files ? 'Sí' : 'No');
        
        if (req.files) {
            console.log('📷 Imágenes:', req.files.imagenes ? req.files.imagenes.length : 0);
            console.log('📄 PDF:', req.files.documento_pdf ? 'Sí' : 'No');
        }

        const {
            user_id,
            titulo,
            descripcion,
            github_url,
            programa
        } = req.body;

        // 🔥 VALIDACIÓN MEJORADA
        if (!user_id) {
            console.error('❌ Falta user_id');
            return res.status(400).json({
                success: false,
                message: 'ID de usuario no proporcionado. Por favor recarga la página e intenta nuevamente.'
            });
        }

        if (!titulo || !descripcion || !programa) {
            console.error('❌ Faltan campos requeridos:', { titulo: !!titulo, descripcion: !!descripcion, programa: !!programa });
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos (título, descripción y programa)'
            });
        }

        // 🔥 OBTENER DATOS DEL USUARIO
        console.log('👤 Buscando usuario con ID:', user_id);
        const [usuarios] = await pool.execute(`
            SELECT u.nombre, u.apellido, u.ID_rol, r.nombre as rol_nombre
            FROM usuario u
            LEFT JOIN rol r ON u.ID_rol = r.ID_rol
            WHERE u.ID_usuario = ?
        `, [user_id]);

        if (usuarios.length === 0) {
            console.error('❌ Usuario no encontrado:', user_id);
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado. Por favor inicia sesión nuevamente.'
            });
        }

        const usuario = usuarios[0];
        const nombreAutor = `${usuario.nombre} ${usuario.apellido}`;
        const rolAutor = usuario.rol_nombre;

        console.log(`👤 Autor: ${nombreAutor}, Rol: ${rolAutor}`);

        // 🔥 PROCESAR ARCHIVOS CON VALIDACIÓN
        let imagenesPaths = [];
        let pdfPath = null;

        if (req.files) {
            if (req.files.imagenes) {
                console.log('📷 Procesando imágenes...');
                imagenesPaths = req.files.imagenes.map(file => {
                    const ruta = `/uploads/${file.filename}`;
                    console.log('  ✅ Imagen guardada:', ruta);
                    return ruta;
                });
            }
            
            if (req.files.documento_pdf && req.files.documento_pdf[0]) {
                pdfPath = `/uploads/${req.files.documento_pdf[0].filename}`;
                console.log('📄 PDF guardado:', pdfPath);
            }
        } else {
            console.log('⚠️ No se recibieron archivos');
        }

        // 🔥 CONVERTIR ARRAY A JSON STRING
        const imagenesJSON = imagenesPaths.length > 0 ? JSON.stringify(imagenesPaths) : null;
        
        console.log('💾 Datos a insertar:', {
            user_id,
            titulo,
            descripcion: descripcion.substring(0, 50) + '...',
            github_url: github_url || 'null',
            pdfPath: pdfPath || 'null',
            imagenesJSON: imagenesJSON || 'null',
            programa,
            rolAutor
        });

        // 🔥 INSERT CON MANEJO DE ERRORES
        try {
            const [result] = await pool.execute(
                `INSERT INTO proyecto 
                (ID_usuario, nombre, descripcion, github_url, documento_pdf, imagenes, 
                 fecha_creacion, fecha_ultima_edicion, programa_autor, rol_autor, ID_rol_autor, estado,
                 ID_estado_proyecto, ID_categoria) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, 'activo', 1, 1)`,
                [
                    user_id, 
                    titulo,
                    descripcion, 
                    github_url || null, 
                    pdfPath, 
                    imagenesJSON,
                    programa,
                    rolAutor,
                    usuario.ID_rol
                ]
            );

            console.log('✅ Proyecto insertado con ID:', result.insertId);

            res.json({
                success: true,
                message: 'Proyecto creado exitosamente',
                proyecto_id: result.insertId,
                autor: nombreAutor,
                rol: rolAutor,
                imagenes: imagenesPaths,
                pdf: pdfPath
            });

        } catch (dbError) {
            console.error('❌ Error en INSERT a BD:', dbError);
            console.error('SQL Error Code:', dbError.code);
            console.error('SQL Error Message:', dbError.sqlMessage);
            
            return res.status(500).json({
                success: false,
                message: 'Error al guardar el proyecto en la base de datos',
                error: dbError.sqlMessage || dbError.message
            });
        }

    } catch (error) {
        console.error('❌ Error general al crear proyecto:', error);
        console.error('Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear el proyecto',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
},

    obtenerProyectos: async (req, res) => {
        try {
            console.log('📚 Obteniendo TODOS los proyectos (sin filtros)');
            
            // 🔥 CONSULTA MEJORADA: Solo proyectos activos
            const [proyectos] = await pool.execute(`
                SELECT 
                    p.ID_proyecto,
                    p.nombre as titulo_proyecto,
                    p.descripcion,
                    p.github_url,
                    p.documento_pdf,
                    p.imagenes,
                    p.fecha_creacion,
                    p.programa_autor,
                    p.rol_autor,
                    u.ID_usuario,
                    u.nombre as nombre_autor,
                    u.apellido as apellido_autor,
                    u.ID_rol,
                    r.nombre as rol_usuario
                FROM proyecto p 
                JOIN usuario u ON p.ID_usuario = u.ID_usuario
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE p.estado = 'activo' AND p.ID_estado_proyecto = 1
                ORDER BY p.fecha_creacion DESC
            `);

            console.log(`✅ Se encontraron ${proyectos.length} proyectos activos (ENDPOINT: /api/proyectos)`);

            const proyectosConImagenes = proyectos.map(proyecto => ({
                ID_proyecto: proyecto.ID_proyecto,
                ID_usuario: proyecto.ID_usuario,
                nombre: proyecto.titulo_proyecto,
                descripcion: proyecto.descripcion,
                github_url: proyecto.github_url,
                documento_pdf: proyecto.documento_pdf,
                imagenes: proyecto.imagenes ? JSON.parse(proyecto.imagenes) : [],
                fecha_creacion: proyecto.fecha_creacion,
                programa_autor: proyecto.programa_autor,
                rol_autor: proyecto.rol_usuario || proyecto.rol_autor,
                nombre_autor: proyecto.nombre_autor,
                apellido_autor: proyecto.apellido_autor,
                autor_completo: `${proyecto.nombre_autor} ${proyecto.apellido_autor}`
            }));

            res.json({
                success: true,
                proyectos: proyectosConImagenes
            });

        } catch (error) {
            console.error('❌ Error al obtener proyectos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar proyectos: ' + error.message
            });
        }
    },

    // 🔥 FUNCIÓN DE BÚSQUEDA COMPLETAMENTE NUEVA
    buscarProyectos: async (req, res) => {
        try {
            const { keyword, programa, fecha } = req.query;

            console.log('🔍 BÚSQUEDA DE PROYECTOS (ENDPOINT: /api/proyectos/buscar)');
            console.log('📊 Parámetros recibidos:', { keyword, programa, fecha });

            let query = `
                SELECT 
                    p.ID_proyecto,
                    p.nombre as titulo_proyecto,
                    p.descripcion,
                    p.github_url,
                    p.documento_pdf,
                    p.imagenes,
                    p.fecha_creacion,
                    p.programa_autor,
                    p.rol_autor,
                    u.ID_usuario,
                    u.nombre as nombre_autor,
                    u.apellido as apellido_autor,
                    u.ID_rol,
                    r.nombre as rol_usuario
                FROM proyecto p 
                JOIN usuario u ON p.ID_usuario = u.ID_usuario
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE p.estado = 'activo' AND p.ID_estado_proyecto = 1
            `;

            const params = [];

            // Búsqueda por palabra clave
            if (keyword && keyword.trim() !== '') {
                console.log('🔤 Aplicando filtro por keyword:', keyword);
                query += ` AND (
                    p.nombre LIKE ? OR 
                    p.descripcion LIKE ? OR 
                    CONCAT(u.nombre, ' ', u.apellido) LIKE ?
                )`;
                const keywordParam = `%${keyword}%`;
                params.push(keywordParam, keywordParam, keywordParam);
            }

            // Búsqueda por programa
            if (programa && programa.trim() !== '') {
                console.log('📚 Aplicando filtro por programa:', programa);
                query += ` AND p.programa_autor = ?`;
                params.push(programa);
            }

            // Búsqueda por fecha
            if (fecha && fecha.trim() !== '') {
                console.log('📅 Aplicando filtro por fecha:', fecha);
                query += ` AND DATE(p.fecha_creacion) = ?`;
                params.push(fecha);
            }

            query += ` ORDER BY p.fecha_creacion DESC`;

            console.log('📝 Query SQL:', query);
            console.log('📝 Parámetros SQL:', params);

            const [proyectos] = await pool.execute(query, params);

            console.log(`✅ ${proyectos.length} proyectos encontrados con los filtros aplicados`);

            const proyectosConImagenes = proyectos.map(proyecto => ({
                ID_proyecto: proyecto.ID_proyecto,
                ID_usuario: proyecto.ID_usuario,
                nombre: proyecto.titulo_proyecto,
                descripcion: proyecto.descripcion,
                github_url: proyecto.github_url,
                documento_pdf: proyecto.documento_pdf,
                imagenes: proyecto.imagenes ? JSON.parse(proyecto.imagenes) : [],
                fecha_creacion: proyecto.fecha_creacion,
                programa_autor: proyecto.programa_autor,
                rol_autor: proyecto.rol_usuario || proyecto.rol_autor,
                nombre_autor: proyecto.nombre_autor,
                apellido_autor: proyecto.apellido_autor,
                autor_completo: `${proyecto.nombre_autor} ${proyecto.apellido_autor}`
            }));

            res.json({
                success: true,
                proyectos: proyectosConImagenes,
                filtros: { keyword, programa, fecha },
                total: proyectosConImagenes.length
            });

        } catch (error) {
            console.error('❌ Error en búsqueda de proyectos:', error);
            console.error('Stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error al buscar proyectos: ' + error.message
            });
        }
    },

    obtenerProyectoPorId: async (req, res) => {
        try {
            const proyectoId = req.params.id;
            
            console.log('📖 Obteniendo proyecto por ID:', proyectoId);
            
            const [proyectos] = await pool.execute(`
                SELECT 
                    p.*,
                    u.nombre as nombre_autor,
                    u.apellido as apellido_autor,
                    u.ID_rol,
                    r.nombre as rol_usuario
                FROM proyecto p 
                JOIN usuario u ON p.ID_usuario = u.ID_usuario
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE p.ID_proyecto = ? AND p.estado = 'activo' AND p.ID_estado_proyecto = 1
            `, [proyectoId]);

            if (proyectos.length === 0) {
                console.log('❌ Proyecto no encontrado:', proyectoId);
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado'
                });
            }

            const proyecto = proyectos[0];
            
            let imagenesArray = [];
            if (proyecto.imagenes) {
                try {
                    imagenesArray = JSON.parse(proyecto.imagenes);
                } catch (e) {
                    console.log('⚠️ Error parseando imágenes:', e);
                    imagenesArray = [proyecto.imagenes];
                }
            }

            console.log('✅ Proyecto encontrado:', proyecto.nombre);

            res.json({
                success: true,
                proyecto: {
                    ...proyecto,
                    imagenes: imagenesArray,
                    rol_autor: proyecto.rol_usuario || proyecto.rol_autor,
                    autor_completo: `${proyecto.nombre_autor} ${proyecto.apellido_autor}`
                }
            });

        } catch (error) {
            console.error('❌ Error al obtener proyecto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar proyecto'
            });
        }
    },

    editarProyecto: async (req, res) => {
        try {
            console.log('=== EDITANDO PROYECTO ===');
            const proyectoId = req.params.id;
            const {
                titulo,
                descripcion,
                programa,
                github_url,
                user_id
            } = req.body;

            // Validar que el usuario es el dueño del proyecto
            const [proyectoExistente] = await pool.execute(
                'SELECT * FROM proyecto WHERE ID_proyecto = ? AND ID_usuario = ? AND estado = "activo"',
                [proyectoId, user_id]
            );

            if (proyectoExistente.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado o no tienes permisos para editarlo'
                });
            }

            // 🔥 VERIFICAR TIEMPO LÍMITE (15 minutos)
            const fechaCreacion = new Date(proyectoExistente[0].fecha_creacion);
            const ahora = new Date();
            const diferenciaMinutos = (ahora - fechaCreacion) / 60000;

            if (diferenciaMinutos > 15) {
                return res.status(403).json({
                    success: false,
                    message: 'El tiempo límite para editar este proyecto (15 minutos) ha expirado',
                    minutosTranscurridos: Math.floor(diferenciaMinutos)
                });
            }

            // Procesar nuevos archivos si se subieron
            let nuevasImagenes = proyectoExistente[0].imagenes ? JSON.parse(proyectoExistente[0].imagenes) : [];
            let nuevoPDF = proyectoExistente[0].documento_pdf;

            if (req.files) {
                if (req.files.imagenes) {
                    nuevasImagenes = req.files.imagenes.map(file => `/uploads/${file.filename}`);
                }
                if (req.files.documento_pdf) {
                    nuevoPDF = `/uploads/${req.files.documento_pdf[0].filename}`;
                }
            }

            // Actualizar en la base de datos
            await pool.execute(
                `UPDATE proyecto 
                 SET nombre = ?, descripcion = ?, programa_autor = ?, github_url = ?, 
                     documento_pdf = ?, imagenes = ?, fecha_ultima_edicion = NOW()
                 WHERE ID_proyecto = ? AND ID_usuario = ?`,
                [
                    titulo,
                    descripcion,
                    programa,
                    github_url || null,
                    nuevoPDF,
                    JSON.stringify(nuevasImagenes),
                    proyectoId,
                    user_id
                ]
            );

            console.log('✅ Proyecto actualizado:', proyectoId);

            res.json({
                success: true,
                message: 'Proyecto actualizado exitosamente',
                proyectoId: proyectoId
            });

        } catch (error) {
            console.error('❌ Error al editar proyecto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    },

    eliminarProyecto: async (req, res) => {
        try {
            const proyectoId = req.params.id;
            const { user_id } = req.body;

            console.log('=== ELIMINANDO PROYECTO (LÓGICO) ===', { proyectoId, user_id });

            // Verificar que el usuario es el dueño del proyecto
            const [proyectoExistente] = await pool.execute(
                'SELECT * FROM proyecto WHERE ID_proyecto = ? AND ID_usuario = ? AND estado = "activo"',
                [proyectoId, user_id]
            );

            if (proyectoExistente.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado o no tienes permisos para eliminarlo'
                });
            }

            // 🔥 BORRADO LÓGICO: Cambiar estado a "inactivo"
            await pool.execute(
                `UPDATE proyecto 
                 SET estado = 'inactivo', 
                     ID_estado_proyecto = 2,
                     fecha_ultima_edicion = NOW()
                 WHERE ID_proyecto = ? AND ID_usuario = ?`,
                [proyectoId, user_id]
            );

            console.log('✅ Proyecto marcado como inactivo (eliminación lógica):', proyectoId);

            res.json({
                success: true,
                message: 'Proyecto eliminado exitosamente'
            });

        } catch (error) {
            console.error('❌ Error al eliminar proyecto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    },

    // ===== MÉTODOS PARA COMENTARIOS =====
    obtenerComentariosProyecto: async (req, res) => {
        try {
            const proyectoId = req.params.id;
            const user_id = req.query.user_id;
            
            console.log('=== DEBUG COMENTARIOS ===');
            console.log('1. Proyecto ID recibido:', proyectoId);
            console.log('2. User ID recibido:', user_id);
            
            const query = `
                SELECT 
                    cp.ID_comentario,
                    cp.contenido,
                    cp.fecha_creacion,
                    cp.ID_estado_comentario,
                    cp.ID_usuario,
                    u.ID_usuario as usuario_id,
                    u.nombre,
                    u.apellido,
                    COALESCE(r.Nombre, 'Aprendiz') as rol,
                    CASE WHEN cp.ID_usuario = ? THEN 1 ELSE 0 END as es_autor
                FROM comentario_proyecto cp
                LEFT JOIN usuario u ON cp.ID_usuario = u.ID_usuario
                LEFT JOIN rol r ON u.ID_rol = r.ID_Rol
                WHERE cp.ID_proyecto = ? AND (cp.ID_estado_comentario = 1 OR cp.ID_estado_comentario IS NULL)
                ORDER BY cp.fecha_creacion DESC
            `;
            
            console.log('3. Ejecutando query...');
            const [comentarios] = await pool.execute(query, [user_id || 0, proyectoId]);
            
            console.log('4. Comentarios encontrados:', comentarios.length);
            
            res.json({
                success: true,
                comentarios: comentarios
            });
            
        } catch (error) {
            console.error('❌ ERROR en obtenerComentariosProyecto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar comentarios: ' + error.message
            });
        }
    },

crearComentario: async (req, res) => {
    try {
        const proyectoId = parseInt(req.params.id);
        const { contenido, user_id } = req.body;
        
        console.log('=== CREANDO COMENTARIO ===');
        console.log('📝 Proyecto ID:', proyectoId);
        console.log('👤 User ID:', user_id);
        console.log('💬 Contenido:', contenido ? contenido.substring(0, 50) + '...' : 'vacío');
        
        // ==================== VALIDACIONES INICIALES ====================
        
        // Validar que contenido y user_id existen
        if (!contenido || !user_id) {
            console.error('❌ Faltan parámetros requeridos:', { contenido: !!contenido, user_id: !!user_id });
            return res.status(400).json({
                success: false,
                message: 'Contenido y user_id son requeridos'
            });
        }

        // Validar que contenido no está vacío
        if (contenido.trim().length === 0) {
            console.error('❌ Contenido vacío después de trim');
            return res.status(400).json({
                success: false,
                message: 'El comentario no puede estar vacío'
            });
        }

        // Validar longitud máxima (100 caracteres)
        if (contenido.length > 100) {
            console.error('❌ Contenido excede 100 caracteres:', contenido.length);
            return res.status(400).json({
                success: false,
                message: 'El comentario no puede tener más de 100 caracteres'
            });
        }

        // Validar que proyectoId es un número válido
        if (isNaN(proyectoId) || proyectoId <= 0) {
            console.error('❌ ID de proyecto inválido:', proyectoId);
            return res.status(400).json({
                success: false,
                message: 'ID de proyecto inválido'
            });
        }

        // ==================== VERIFICAR PROYECTO EXISTE ====================
        
        console.log('🔍 Verificando que el proyecto existe...');
        const [proyectos] = await pool.execute(
            'SELECT ID_proyecto FROM proyecto WHERE ID_proyecto = ? AND estado = "activo"',
            [proyectoId]
        );

        if (proyectos.length === 0) {
            console.error('❌ Proyecto no encontrado o inactivo:', proyectoId);
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        
        console.log('✅ Proyecto encontrado:', proyectoId);

        // ==================== VERIFICAR USUARIO EXISTE ====================
        
        console.log('🔍 Verificando que el usuario existe...');
        const [usuarios] = await pool.execute(
            'SELECT ID_usuario, nombre, apellido FROM usuario WHERE ID_usuario = ?',
            [user_id]
        );

        if (usuarios.length === 0) {
            console.error('❌ Usuario no encontrado con ID:', user_id);
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado con ID: ' + user_id
            });
        }
        
        console.log('✅ Usuario encontrado:', usuarios[0].nombre, usuarios[0].apellido);

        // ==================== INSERTAR COMENTARIO ====================
        
        const query = `
            INSERT INTO comentario_proyecto 
            (ID_proyecto, ID_usuario, contenido, fecha_creacion, ID_estado_comentario)
            VALUES (?, ?, ?, NOW(), 1)
        `;
        
        console.log('💾 Insertando comentario en la base de datos...');
        const [result] = await pool.execute(query, [proyectoId, user_id, contenido.trim()]);
        
        const comentarioId = result.insertId;
        console.log('✅ Comentario creado exitosamente con ID:', comentarioId);

        // ==================== OBTENER COMENTARIO COMPLETO ====================
        
        console.log('📖 Obteniendo datos completos del comentario creado...');
        const [comentariosCreados] = await pool.execute(`
            SELECT 
                cp.ID_comentario,
                cp.contenido,
                cp.fecha_creacion,
                cp.ID_usuario,
                u.ID_usuario as usuario_id,
                u.nombre,
                u.apellido,
                COALESCE(r.nombre, 'Usuario') as rol
            FROM comentario_proyecto cp
            INNER JOIN usuario u ON cp.ID_usuario = u.ID_usuario
            LEFT JOIN rol r ON u.ID_rol = r.ID_rol
            WHERE cp.ID_comentario = ?
        `, [comentarioId]);

        if (comentariosCreados.length === 0) {
            console.error('❌ No se pudo recuperar el comentario creado');
            return res.status(500).json({
                success: false,
                message: 'Comentario creado pero no se pudo recuperar'
            });
        }

        const comentarioCreado = comentariosCreados[0];
        
        console.log('📊 Datos del comentario creado:', {
            ID: comentarioCreado.ID_comentario,
            autor: `${comentarioCreado.nombre} ${comentarioCreado.apellido}`,
            rol: comentarioCreado.rol,
            fecha: comentarioCreado.fecha_creacion
        });

        // ==================== RESPUESTA EXITOSA ====================
        
        res.status(201).json({
            success: true,
            message: 'Comentario publicado exitosamente',
            comentario: {
                ID_comentario: comentarioCreado.ID_comentario,
                contenido: comentarioCreado.contenido,
                fecha_creacion: comentarioCreado.fecha_creacion,
                ID_usuario: comentarioCreado.ID_usuario,
                nombre: comentarioCreado.nombre,
                apellido: comentarioCreado.apellido,
                rol: comentarioCreado.rol
            }
        });
        
        console.log('✅ Respuesta enviada correctamente');
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO al crear comentario:', error);
        console.error('📋 Stack trace:', error.stack);
        console.error('📋 Error completo:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage
        });
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear el comentario',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error al procesar la solicitud'
        });
    }
},

    editarComentario: async (req, res) => {
        try {
            const comentarioId = parseInt(req.params.id);
            const { contenido, user_id } = req.body;
            
            console.log('=== EDITANDO COMENTARIO ===');
            console.log('Comentario ID:', comentarioId);
            console.log('User ID:', user_id);
            console.log('Nuevo contenido:', contenido);

            if (!contenido || !user_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Contenido y user_id son requeridos'
                });
            }

            if (contenido.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El comentario no puede estar vacío'
                });
            }

            if (contenido.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'El comentario no puede tener más de 100 caracteres'
                });
            }

            const [comentarios] = await pool.execute(
                'SELECT * FROM comentario_proyecto WHERE ID_comentario = ? AND ID_usuario = ?',
                [comentarioId, user_id]
            );

            if (comentarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado o no tienes permisos para editarlo'
                });
            }

            const [result] = await pool.execute(
                'UPDATE comentario_proyecto SET contenido = ? WHERE ID_comentario = ? AND ID_usuario = ?',
                [contenido.trim(), comentarioId, user_id]
            );

            console.log('✅ Comentario actualizado:', comentarioId);

            res.json({
                success: true,
                message: 'Comentario actualizado exitosamente'
            });

        } catch (error) {
            console.error('❌ Error al editar comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    },

    eliminarComentario: async (req, res) => {
        try {
            const comentarioId = parseInt(req.params.id);
            const { user_id } = req.body;

            console.log('=== ELIMINANDO COMENTARIO ===', { comentarioId, user_id });

            const [comentarios] = await pool.execute(
                'SELECT * FROM comentario_proyecto WHERE ID_comentario = ? AND ID_usuario = ?',
                [comentarioId, user_id]
            );

            if (comentarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado o no tienes permisos para eliminarlo'
                });
            }

            const [result] = await pool.execute(
                'DELETE FROM comentario_proyecto WHERE ID_comentario = ? AND ID_usuario = ?',
                [comentarioId, user_id]
            );

            console.log('✅ Comentario eliminado:', comentarioId);

            res.json({
                success: true,
                message: 'Comentario eliminado exitosamente'
            });

        } catch (error) {
            console.error('❌ Error al eliminar comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    }
}