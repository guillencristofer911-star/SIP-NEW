import pool from '../database/db.js';

export const methods = {
    crearProyecto: async (req, res) => {
        try {
            console.log('=== INICIANDO CREACIÓN DE PROYECTO ===');
            console.log('Datos recibidos:', req.body);
            console.log('Archivos recibidos:', req.files);

            const {
                user_id,
                titulo,
                descripcion,
                github_url,
                programa
            } = req.body;

            // Validar campos requeridos
            if (!user_id || !titulo || !descripcion || !programa) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // 🔥 OBTENER DATOS DEL USUARIO CON SU ROL
            const [usuarios] = await pool.execute(`
                SELECT u.nombre, u.apellido, u.ID_rol, r.nombre as rol_nombre
                FROM usuario u
                LEFT JOIN rol r ON u.ID_rol = r.ID_rol
                WHERE u.ID_usuario = ?
            `, [user_id]);

            if (usuarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const usuario = usuarios[0];
            const nombreAutor = `${usuario.nombre} ${usuario.apellido}`;
            const rolAutor = usuario.rol_nombre;

            console.log(`👤 Autor: ${nombreAutor}, Rol: ${rolAutor}`);

            // Procesar archivos subidos
            let imagenesPaths = [];
            let pdfPath = null;

            if (req.files) {
                if (req.files.imagenes) {
                    imagenesPaths = req.files.imagenes.map(file => `/uploads/${file.filename}`);
                    console.log('📷 Imágenes guardadas:', imagenesPaths);
                }
                
                if (req.files.documento_pdf) {
                    pdfPath = `/uploads/${req.files.documento_pdf[0].filename}`;
                    console.log('📄 PDF guardado:', pdfPath);
                }
            }

            // 🔥 INSERT con timestamp
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
                    JSON.stringify(imagenesPaths),
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
                rol: rolAutor
            });

        } catch (error) {
            console.error('❌ Error al crear proyecto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    },

    obtenerProyectos: async (req, res) => {
        try {
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

            console.log(`📚 Se encontraron ${proyectos.length} proyectos activos`);

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

    obtenerProyectoPorId: async (req, res) => {
        try {
            const proyectoId = req.params.id;
            
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
            // El proyecto NO se elimina de la base de datos, solo se oculta
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

    // ===== NUEVOS MÉTODOS PARA COMENTARIOS =====
obtenerComentariosProyecto: async (req, res) => {
    try {
        const proyectoId = req.params.id;
        const user_id = req.query.user_id;
        
        console.log('=== DEBUG COMENTARIOS ===');
        console.log('1. Proyecto ID recibido:', proyectoId);
        console.log('2. User ID recibido:', user_id);
        
        // ✅ CONSULTA MEJORADA - Obtener timestamp actual del servidor MySQL
        const [tiempoServidor] = await pool.execute('SELECT NOW() as ahora, UNIX_TIMESTAMP(NOW()) as timestamp_ahora');
        console.log('⏰ Tiempo servidor MySQL:', tiempoServidor[0]);
        
        const query = `
            SELECT 
                cp.ID_comentario,
                cp.contenido,
                cp.fecha_creacion,
                UNIX_TIMESTAMP(cp.fecha_creacion) as fecha_creacion_timestamp,
                cp.ID_estado_comentario,
                cp.ID_usuario,
                u.ID_usuario as usuario_id,
                u.nombre,
                u.apellido,
                COALESCE(r.Nombre, 'Aprendiz') as rol,
                CASE WHEN cp.ID_usuario = ? THEN 1 ELSE 0 END as es_autor,
                NOW() as servidor_ahora,
                UNIX_TIMESTAMP(NOW()) as servidor_timestamp_ahora
            FROM comentario_proyecto cp
            LEFT JOIN usuario u ON cp.ID_usuario = u.ID_usuario
            LEFT JOIN rol r ON u.ID_rol = r.ID_Rol
            WHERE cp.ID_proyecto = ? AND (cp.ID_estado_comentario = 1 OR cp.ID_estado_comentario IS NULL)
            ORDER BY cp.fecha_creacion DESC
        `;
        
        console.log('3. Ejecutando query...');
        const [comentarios] = await pool.execute(query, [user_id || 0, proyectoId]);
        
        console.log('4. Comentarios encontrados:', comentarios.length);
        
        // ✅ PROCESAR COMENTARIOS CON DEBUGGING DETALLADO
        const comentariosProcesados = comentarios.map(comentario => {
            const fecha_creacion_js = comentario.fecha_creacion_timestamp * 1000;
            const ahora_js = comentario.servidor_timestamp_ahora * 1000;
            
            console.log(`📝 Comentario ${comentario.ID_comentario}:`, {
                fecha_creacion: comentario.fecha_creacion,
                fecha_creacion_timestamp: comentario.fecha_creacion_timestamp,
                fecha_creacion_js: fecha_creacion_js,
                servidor_ahora: comentario.servidor_ahora,
                servidor_timestamp_ahora: comentario.servidor_timestamp_ahora,
                ahora_js: ahora_js,
                diferencia_ms: ahora_js - fecha_creacion_js,
                diferencia_min: Math.floor((ahora_js - fecha_creacion_js) / 60000)
            });
            
            return {
                ID_comentario: comentario.ID_comentario,
                contenido: comentario.contenido,
                fecha_creacion: comentario.fecha_creacion,
                fecha_creacion_timestamp: comentario.fecha_creacion_timestamp,
                fecha_creacion_js: fecha_creacion_js,
                ID_estado_comentario: comentario.ID_estado_comentario,
                ID_usuario: comentario.ID_usuario,
                usuario_id: comentario.usuario_id,
                nombre: comentario.nombre,
                apellido: comentario.apellido,
                rol: comentario.rol,
                es_autor: comentario.es_autor
            };
        });
        
        res.json({
            success: true,
            comentarios: comentariosProcesados
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
        console.log('Proyecto ID:', proyectoId);
        console.log('User ID:', user_id);
        console.log('Contenido:', contenido);

        // Validaciones
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

        // VERIFICAR QUE EL PROYECTO EXISTA
        const [proyectos] = await pool.execute(
            'SELECT ID_proyecto FROM proyecto WHERE ID_proyecto = ? AND estado = "activo"',
            [proyectoId]
        );

        if (proyectos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        // VERIFICAR QUE EL USUARIO EXISTA
        const [usuarios] = await pool.execute(
            'SELECT ID_usuario FROM usuario WHERE ID_usuario = ?',
            [user_id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // ✅ OBTENER TIEMPO ACTUAL DEL SERVIDOR MYSQL ANTES DE INSERTAR
        const [tiempoAntes] = await pool.execute('SELECT NOW() as ahora, UNIX_TIMESTAMP(NOW()) as timestamp_ahora');
        console.log('⏰ Tiempo antes de INSERT:', tiempoAntes[0]);

        // ✅ INSERTAR COMENTARIO - Asegurarse que fecha_creacion use NOW()
        const query = `
            INSERT INTO comentario_proyecto 
            (ID_proyecto, ID_usuario, contenido, fecha_creacion, ID_estado_comentario)
            VALUES (?, ?, ?, NOW(), 1)
        `;
        
        console.log('📝 Ejecutando INSERT con valores:', [proyectoId, user_id, contenido.trim()]);
        
        const [result] = await pool.execute(query, [proyectoId, user_id, contenido.trim()]);
        
        console.log('✅ Comentario creado con ID:', result.insertId);

        // Verificar que se creó correctamente
        if (!result.insertId || result.insertId === 0) {
            throw new Error('No se generó un ID válido para el comentario');
        }

        // ✅ OBTENER COMENTARIO RECIÉN CREADO CON TIMESTAMP CORRECTO
        const [comentariosCreados] = await pool.execute(`
            SELECT 
                cp.ID_comentario,
                cp.contenido,
                cp.fecha_creacion,
                UNIX_TIMESTAMP(cp.fecha_creacion) as fecha_creacion_timestamp,
                u.ID_usuario,
                u.nombre,
                u.apellido,
                COALESCE(r.nombre, 'Usuario') as rol,
                NOW() as servidor_ahora,
                UNIX_TIMESTAMP(NOW()) as servidor_timestamp_ahora
            FROM comentario_proyecto cp
            INNER JOIN usuario u ON cp.ID_usuario = u.ID_usuario
            LEFT JOIN rol r ON u.ID_rol = r.ID_rol
            WHERE cp.ID_comentario = ?
        `, [result.insertId]);

        if (comentariosCreados.length === 0) {
            throw new Error('No se pudo recuperar el comentario creado');
        }

        const comentario = comentariosCreados[0];
        const fecha_creacion_js = comentario.fecha_creacion_timestamp * 1000;
        const ahora_js = comentario.servidor_timestamp_ahora * 1000;

        console.log('📅 Comentario creado - DEBUGGING:', {
            id: comentario.ID_comentario,
            fecha_mysql: comentario.fecha_creacion,
            timestamp_segundos: comentario.fecha_creacion_timestamp,
            fecha_creacion_js: fecha_creacion_js,
            servidor_ahora: comentario.servidor_ahora,
            servidor_timestamp: comentario.servidor_timestamp_ahora,
            ahora_js: ahora_js,
            diferencia_ms: ahora_js - fecha_creacion_js,
            diferencia_segundos: (ahora_js - fecha_creacion_js) / 1000
        });

        res.json({
            success: true,
            message: 'Comentario publicado exitosamente',
            comentario: {
                ID_comentario: comentario.ID_comentario,
                contenido: comentario.contenido,
                fecha_creacion: comentario.fecha_creacion,
                fecha_creacion_timestamp: comentario.fecha_creacion_timestamp,
                fecha_creacion_js: fecha_creacion_js,
                ID_usuario: comentario.ID_usuario,
                nombre: comentario.nombre,
                apellido: comentario.apellido,
                rol: comentario.rol
            }
        });
        
    } catch (error) {
        console.error('❌ Error al crear comentario:', error);
        console.error('Código de error:', error.code);
        console.error('Número de error SQL:', error.errno);
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Error de referencia: Verifique que el proyecto y usuario existan'
            });
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Error: Ya existe un comentario con ese ID. Por favor intenta nuevamente.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
},

crearComentario: async (req, res) => {
    try {
        const proyectoId = parseInt(req.params.id);
        const { contenido, user_id } = req.body;
        
        console.log('=== CREANDO COMENTARIO ===');
        console.log('Proyecto ID:', proyectoId);
        console.log('User ID:', user_id);
        console.log('Contenido:', contenido);

        // Validaciones
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

        // VERIFICAR QUE EL PROYECTO EXISTA
        const [proyectos] = await pool.execute(
            'SELECT ID_proyecto FROM proyecto WHERE ID_proyecto = ? AND estado = "activo"',
            [proyectoId]
        );

        if (proyectos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        // VERIFICAR QUE EL USUARIO EXISTA
        const [usuarios] = await pool.execute(
            'SELECT ID_usuario FROM usuario WHERE ID_usuario = ?',
            [user_id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // ✅ INSERTAR COMENTARIO SIN VERIFICAR ESTADO (usar DEFAULT o NULL)
        const query = `
            INSERT INTO comentario_proyecto 
            (ID_proyecto, ID_usuario, contenido, fecha_creacion, ID_estado_comentario)
            VALUES (?, ?, ?, NOW(), 1)
        `;
        
        console.log('📝 Ejecutando INSERT con valores:', [proyectoId, user_id, contenido.trim()]);
        
        const [result] = await pool.execute(query, [proyectoId, user_id, contenido.trim()]);
        
        console.log('✅ Comentario creado con ID:', result.insertId);

        // Verificar que se creó correctamente
        if (!result.insertId || result.insertId === 0) {
            throw new Error('No se generó un ID válido para el comentario');
        }

        // ✅ OBTENER COMENTARIO CON TIMESTAMP EN MILISEGUNDOS (igual que respuestas)
        const [comentariosCreados] = await pool.execute(`
            SELECT 
                cp.ID_comentario,
                cp.contenido,
                DATE_FORMAT(cp.fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_creacion,
                UNIX_TIMESTAMP(cp.fecha_creacion) as fecha_creacion_timestamp,
                u.ID_usuario,
                u.nombre,
                u.apellido,
                COALESCE(r.nombre, 'Usuario') as rol
            FROM comentario_proyecto cp
            INNER JOIN usuario u ON cp.ID_usuario = u.ID_usuario
            LEFT JOIN rol r ON u.ID_rol = r.ID_rol
            WHERE cp.ID_comentario = ?
        `, [result.insertId]);

        if (comentariosCreados.length === 0) {
            throw new Error('No se pudo recuperar el comentario creado');
        }

        // ✅ CONVERTIR TIMESTAMP A MILISEGUNDOS (igual que en respuestas)
        const comentario = comentariosCreados[0];
        const fecha_creacion_js = comentario.fecha_creacion_timestamp * 1000;

        console.log('📅 Comentario creado:', {
            id: comentario.ID_comentario,
            fecha_mysql: comentario.fecha_creacion,
            timestamp_segundos: comentario.fecha_creacion_timestamp,
            fecha_creacion_js: fecha_creacion_js
        });

        res.json({
            success: true,
            message: 'Comentario publicado exitosamente',
            comentario: {
                ...comentario,
                fecha_creacion_js: fecha_creacion_js // ✅ AGREGAR TIMESTAMP EN MILISEGUNDOS
            }
        });
        
    } catch (error) {
        console.error('❌ Error al crear comentario:', error);
        console.error('Código de error:', error.code);
        console.error('Número de error SQL:', error.errno);
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Error de referencia: Verifique que el proyecto y usuario existan'
            });
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Error: Ya existe un comentario con ese ID. Por favor intenta nuevamente.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
},
        // ===== MÉTODOS PARA EDITAR Y ELIMINAR COMENTARIOS =====
    editarComentario: async (req, res) => {
        try {
            const comentarioId = parseInt(req.params.id);
            const { contenido, user_id } = req.body;
            
            console.log('=== EDITANDO COMENTARIO ===');
            console.log('Comentario ID:', comentarioId);
            console.log('User ID:', user_id);
            console.log('Nuevo contenido:', contenido);

            // Validaciones
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

            // Verificar que el comentario existe y pertenece al usuario
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

            // Actualizar el comentario
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

            // Verificar que el comentario existe y pertenece al usuario
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

            // Eliminar el comentario (borrado físico)
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

