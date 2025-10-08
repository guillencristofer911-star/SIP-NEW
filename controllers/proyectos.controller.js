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

            // OBTENER DATOS DEL USUARIO PARA EL AUTOR
            const [usuarios] = await pool.execute(
                'SELECT nombre, apellido FROM usuario WHERE ID_usuario = ?',
                [user_id]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const usuario = usuarios[0];
            const nombreAutor = `${usuario.nombre} ${usuario.apellido}`;

            // Procesar archivos subidos
            let imagenesPaths = [];
            let pdfPath = null;

            if (req.files) {
                // Procesar imágenes
                if (req.files.imagenes) {
                    imagenesPaths = req.files.imagenes.map(file => `/uploads/${file.filename}`);
                    console.log('Imágenes guardadas:', imagenesPaths);
                }
                
                // Procesar PDF
                if (req.files.documento_pdf) {
                    pdfPath = `/uploads/${req.files.documento_pdf[0].filename}`;
                    console.log('PDF guardado:', pdfPath);
                }
            }

            // INSERT CORREGIDO - USANDO 'titulo' PARA EL NOMBRE DEL PROYECTO
            const [result] = await pool.execute(
                `INSERT INTO proyecto 
                (ID_usuario, nombre, descripcion, github_url, documento_pdf, imagenes, 
                 fecha_creacion, fecha_ultima_edicion, programa_autor, rol_autor, estado,
                 ID_estado_proyecto, ID_categoria) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, 'egresado', 'activo', ?, ?)`,
                [
                    user_id, 
                    titulo,  // ← Este es el TÍTULO del proyecto
                    descripcion, 
                    github_url || null, 
                    pdfPath, 
                    JSON.stringify(imagenesPaths),
                    programa,
                    1,  // ID_estado_proyecto = activo
                    1   // ID_categoria = Desarrollo de Software
                ]
            );

            console.log('✅ Proyecto insertado con ID:', result.insertId);

            res.json({
                success: true,
                message: 'Proyecto creado exitosamente',
                proyecto_id: result.insertId,
                autor: nombreAutor // Devolver el nombre del autor
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
            // CONSULTA MEJORADA - OBTENER DATOS COMPLETOS DEL AUTOR
            const [proyectos] = await pool.execute(`
                SELECT 
                    p.ID_proyecto,
                    p.nombre as titulo_proyecto,  -- ← Título del proyecto
                    p.descripcion,
                    p.github_url,
                    p.documento_pdf,
                    p.imagenes,
                    p.fecha_creacion,
                    p.programa_autor,
                    p.rol_autor,
                    u.ID_usuario,
                    u.nombre as nombre_autor,      -- ← Nombre del autor
                    u.apellido as apellido_autor   -- ← Apellido del autor
                FROM proyecto p 
                JOIN usuario u ON p.ID_usuario = u.ID_usuario 
                WHERE p.estado = 'activo' OR p.ID_estado_proyecto = 1
                ORDER BY p.fecha_creacion DESC
            `);

            // Parsear las imágenes de JSON a array y estructurar datos
            const proyectosConImagenes = proyectos.map(proyecto => ({
                ID_proyecto: proyecto.ID_proyecto,
                nombre: proyecto.titulo_proyecto,  // Título del proyecto
                descripcion: proyecto.descripcion,
                github_url: proyecto.github_url,
                documento_pdf: proyecto.documento_pdf,
                imagenes: proyecto.imagenes ? JSON.parse(proyecto.imagenes) : [],
                fecha_creacion: proyecto.fecha_creacion,
                programa_autor: proyecto.programa_autor,
                rol_autor: proyecto.rol_autor,
                // Datos del autor
                nombre_autor: proyecto.nombre_autor,
                apellido_autor: proyecto.apellido_autor,
                autor_completo: `${proyecto.nombre_autor} ${proyecto.apellido_autor}`
            }));

            console.log('Proyectos cargados:', proyectosConImagenes.length);

            res.json({
                success: true,
                proyectos: proyectosConImagenes
            });

        } catch (error) {
            console.error('Error al obtener proyectos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar proyectos: ' + error.message
            });
        }
    },

    // OBTENER UN PROYECTO POR ID (ACTUALIZADO)
    obtenerProyectoPorId: async (req, res) => {
        try {
            const proyectoId = req.params.id;
            
            const [proyectos] = await pool.execute(`
                SELECT 
                    p.*,
                    u.nombre as nombre_autor,
                    u.apellido as apellido_autor
                FROM proyecto p 
                JOIN usuario u ON p.ID_usuario = u.ID_usuario 
                WHERE p.ID_proyecto = ? AND (p.estado = 'activo' OR p.ID_estado_proyecto = 1)
            `, [proyectoId]);

            if (proyectos.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado'
                });
            }

            const proyecto = proyectos[0];
            
            // Parsear imágenes de JSON a array
            let imagenesArray = [];
            if (proyecto.imagenes) {
                try {
                    imagenesArray = JSON.parse(proyecto.imagenes);
                } catch (e) {
                    console.log('Error parseando imágenes:', e);
                    imagenesArray = [proyecto.imagenes];
                }
            }

            res.json({
                success: true,
                proyecto: {
                    ...proyecto,
                    imagenes: imagenesArray,
                    autor_completo: `${proyecto.nombre_autor} ${proyecto.apellido_autor}`
                }
            });

        } catch (error) {
            console.error('Error al obtener proyecto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar proyecto'
            });
        }
    },

    // ... (mantener las funciones editarProyecto y eliminarProyecto igual)
    editarProyecto: async (req, res) => {
        try {
            console.log('=== EDITANDO PROYECTO ===');
            console.log('Body:', req.body);
            console.log('Files:', req.files);
            console.log('Params:', req.params);

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
                'SELECT * FROM proyecto WHERE ID_proyecto = ? AND ID_usuario = ?',
                [proyectoId, user_id]
            );

            if (proyectoExistente.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado o no tienes permisos para editarlo'
                });
            }

            // Procesar nuevos archivos si se subieron
            let nuevasImagenes = proyectoExistente[0].imagenes ? JSON.parse(proyectoExistente[0].imagenes) : [];
            let nuevoPDF = proyectoExistente[0].documento_pdf;

            if (req.files) {
                // Procesar nuevas imágenes
                if (req.files.imagenes) {
                    nuevasImagenes = req.files.imagenes.map(file => `/uploads/${file.filename}`);
                    console.log('Nuevas imágenes:', nuevasImagenes);
                }
                
                // Procesar nuevo PDF
                if (req.files.documento_pdf) {
                    nuevoPDF = `/uploads/${req.files.documento_pdf[0].filename}`;
                    console.log('Nuevo PDF:', nuevoPDF);
                }
            }

            // Actualizar en la base de datos
            const [result] = await pool.execute(
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

            console.log('=== ELIMINANDO PROYECTO ===', { proyectoId, user_id });

            // Verificar que el usuario es el dueño del proyecto
            const [proyectoExistente] = await pool.execute(
                'SELECT * FROM proyecto WHERE ID_proyecto = ? AND ID_usuario = ?',
                [proyectoId, user_id]
            );

            if (proyectoExistente.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado o no tienes permisos para eliminarlo'
                });
            }

            // Borrado lógico (cambiar estado a inactivo)
            const [result] = await pool.execute(
                'UPDATE proyecto SET estado = "inactivo", ID_estado_proyecto = 2 WHERE ID_proyecto = ?',
                [proyectoId]
            );

            console.log('✅ Proyecto eliminado (lógico):', proyectoId);

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
    }
};