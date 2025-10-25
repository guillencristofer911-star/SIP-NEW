// ==================== VARIABLES GLOBALES ====================
let usuarioActual = null;
let token = null;
let menuAbierto = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación de proyectos...');
    
    // Verificar autenticación
    verificarAutenticacion();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Cargar proyectos
    cargarProyectos();
});

// ==================== AUTENTICACIÓN ====================
function verificarAutenticacion() {
    token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    
    if (!token || !usuarioStr) {
        console.log('❌ No hay sesión activa, redirigiendo al login...');
        alert('Debes iniciar sesión para acceder a esta página');
        window.location.href = '/login';
        return;
    }
    
    try {
        usuarioActual = JSON.parse(usuarioStr);
        console.log('✅ Usuario autenticado:', usuarioActual);
        console.log('✅ ID del usuario:', usuarioActual.id);
        
        // ✅ ACTUALIZAR ID DE USUARIO EN LOS INPUTS HIDDEN
        actualizarUserIdEnFormularios();
        
        // Actualizar header con info del usuario
        actualizarHeaderUsuario();
        
    } catch (error) {
        console.error('Error al parsear usuario:', error);
        alert('Error en la sesión. Por favor inicia sesión nuevamente.');
        window.location.href = '/login';
    }
}

// ✅ FUNCIÓN PARA ACTUALIZAR user_id EN TODOS LOS FORMULARIOS
function actualizarUserIdEnFormularios() {
    if (!usuarioActual || !usuarioActual.id) {
        console.error('❌ No hay usuario autenticado');
        return;
    }
    
    // Actualizar input en modal de crear proyecto
    const userIdInput = document.getElementById('user_id');
    if (userIdInput) {
        userIdInput.value = usuarioActual.id;
        console.log('✅ user_id establecido en formulario crear:', usuarioActual.id);
    } else {
        console.error('❌ Input #user_id no encontrado en el DOM');
    }
    
    // Actualizar input en modal de editar proyecto
    const editUserIdInput = document.getElementById('edit_user_id');
    if (editUserIdInput) {
        editUserIdInput.value = usuarioActual.id;
        console.log('✅ edit_user_id establecido:', usuarioActual.id);
    }
}

function actualizarHeaderUsuario() {
    const userNameElement = document.querySelector('.user-name');
    const userAvatarElement = document.querySelector('.user-avatar');
    
    if (userNameElement && usuarioActual) {
        userNameElement.textContent = usuarioActual.nombre;
    }
    
    if (userAvatarElement && usuarioActual) {
        userAvatarElement.textContent = usuarioActual.nombre.charAt(0).toUpperCase();
    }
}

// ==================== EVENT LISTENERS ====================
function configurarEventListeners() {
    // Menú de perfil
    const perfilBtn = document.getElementById('perfil-btn');
    const popoverMenu = document.getElementById('popover-menu');
    
    if (perfilBtn && popoverMenu) {
        perfilBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = popoverMenu.style.display === 'block';
            popoverMenu.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                const rect = perfilBtn.getBoundingClientRect();
                popoverMenu.style.top = (rect.bottom + 10) + 'px';
                popoverMenu.style.right = '20px';
            }
        });
        
        // Opciones del menú
        document.querySelectorAll('.popover-list li').forEach((li, idx) => {
            li.addEventListener('click', () => {
                switch(idx) {
                    case 0: alert('Ir al Perfil'); break;
                    case 1: alert('Ir a Configuración'); break;
                    case 2: alert('Ir a Favoritos'); break;
                    case 3: alert('Ir a Ayuda'); break;
                }
                popoverMenu.style.display = 'none';
            });
        });
    }
    
    // Cerrar popover al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (popoverMenu && !popoverMenu.contains(e.target) && e.target !== perfilBtn) {
            popoverMenu.style.display = 'none';
        }
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }
    
    // Modal subir proyecto
    const btnSubir = document.querySelector('.btn-subir');
    if (btnSubir) {
        btnSubir.addEventListener('click', function() {
            if (!usuarioActual) {
                alert('Debes iniciar sesión para subir proyectos');
                window.location.href = '/login';
                return;
            }
            
            // ✅ ASEGURAR QUE EL user_id ESTÉ ACTUALIZADO ANTES DE ABRIR EL MODAL
            actualizarUserIdEnFormularios();
            
            document.getElementById('modal-subir-proyecto').style.display = 'flex';
        });
    }
    
    // Botones de cancelar modales
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            document.getElementById('modal-subir-proyecto').style.display = 'none';
        });
    }
    
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
    if (btnCancelarEdicion) {
        btnCancelarEdicion.addEventListener('click', function() {
            document.getElementById('modal-editar-proyecto').style.display = 'none';
        });
    }
    
    // Cerrar modales al hacer clic fuera
    const modalSubir = document.getElementById('modal-subir-proyecto');
    if (modalSubir) {
        modalSubir.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }
    
    const modalEditar = document.getElementById('modal-editar-proyecto');
    if (modalEditar) {
        modalEditar.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }
    
    // Formulario de subir proyecto
    const formSubir = document.getElementById('form-subir-proyecto');
    if (formSubir) {
        formSubir.addEventListener('submit', subirProyecto);
    }
    
    // Formulario de editar proyecto
    const formEditar = document.getElementById('form-editar-proyecto');
    if (formEditar) {
        formEditar.addEventListener('submit', actualizarProyecto);
    }
    
    // PDF personalizado
    configurarPDFInputs();
    
    // Notificaciones
    configurarNotificaciones();
    
    // Botón limpiar filtros
    const btnLimpiar = document.querySelector('.btn-limpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFiltros);
    }
}

// ==================== CERRAR SESIÓN ====================
function cerrarSesion(e) {
    e.preventDefault();
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    alert('Sesión cerrada exitosamente');
    window.location.href = '/login';
}

// ==================== SUBIR PROYECTO ====================
async function subirProyecto(e) {
    e.preventDefault();
    
    if (!usuarioActual || !token) {
        alert('❌ Debes iniciar sesión para subir proyectos');
        window.location.href = '/login';
        return;
    }
    
    // ✅ VERIFICAR Y ACTUALIZAR user_id JUSTO ANTES DE ENVIAR
    actualizarUserIdEnFormularios();
    
    const formData = new FormData(this);
    const submitBtn = document.getElementById('btn-publicar');
    
    // ✅ VERIFICAR QUE user_id ESTÉ EN EL FORMDATA
    let userId = formData.get('user_id');
    console.log('📋 user_id en FormData:', userId);
    
    // ✅ SI NO ESTÁ, AGREGARLO MANUALMENTE
    if (!userId || userId === '') {
        console.log('⚠️ user_id vacío, estableciendo manualmente...');
        formData.set('user_id', usuarioActual.id);
        userId = usuarioActual.id;
        console.log('✅ user_id establecido manualmente:', userId);
    }
    
    // Validar otros campos requeridos
    const titulo = formData.get('titulo');
    const descripcion = formData.get('descripcion');
    const programa = formData.get('programa');
    
    console.log('📋 Datos del formulario:', { 
        titulo, 
        descripcion, 
        programa, 
        userId 
    });
    
    if (!titulo || !descripcion || !programa) {
        alert('❌ Por favor completa todos los campos requeridos (título, descripción, programa)');
        return;
    }
    
    if (!userId) {
        alert('❌ Error: No se pudo obtener el ID de usuario. Por favor recarga la página.');
        console.error('❌ user_id no está presente después de intentar establecerlo');
        return;
    }
    
    // Mostrar loading
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
    submitBtn.disabled = true;
    
    try {
        console.log('📤 Enviando proyecto...');
        
        const response = await fetch('/api/proyectos/crear', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (data.success) {
            alert('✅ Proyecto publicado exitosamente!');
            
            document.getElementById('modal-subir-proyecto').style.display = 'none';
            
            this.reset();
            document.getElementById('pdf-name').textContent = '';
            document.getElementById('pdf-preview').innerHTML = '';
            
            await cargarProyectos();
        } else {
            throw new Error(data.message || 'Error al publicar proyecto');
        }
        
    } catch (error) {
        console.error('❌ Error al publicar proyecto:', error);
        alert('❌ Error al publicar proyecto: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ==================== CARGAR PROYECTOS ====================
async function cargarProyectos() {
    try {
        console.log('📖 Cargando proyectos...');
        
        const response = await fetch('/api/proyectos');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📚 Proyectos cargados:', data);
        
        if (data.success) {
            mostrarProyectos(data.proyectos);
        } else {
            throw new Error(data.message || 'Error al cargar proyectos');
        }
    } catch (error) {
        console.error('❌ Error al cargar proyectos:', error);
        document.getElementById('proyectos-lista').innerHTML = `
            <div class="proyecto-card" style="text-align: center; padding: 40px;">
                <h3>Error al cargar proyectos</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ==================== MOSTRAR PROYECTOS ====================
function mostrarProyectos(proyectos) {
    const contenedor = document.getElementById('proyectos-lista');
    
    if (!proyectos || proyectos.length === 0) {
        contenedor.innerHTML = `
            <div class="proyecto-card" style="text-align: center; padding: 40px;">
                <h3>No hay proyectos publicados aún</h3>
                <p>¡Sé el primero en compartir tu proyecto!</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = proyectos.map((proyecto) => {
        const esAutor = usuarioActual && usuarioActual.id === proyecto.ID_usuario;
        const puedeEditar = esAutor && verificarTiempoEdicion(proyecto.fecha_creacion);
        const minutosRestantes = calcularMinutosRestantes(proyecto.fecha_creacion);
        
        let indicadorTiempo = '';
        if (esAutor && minutosRestantes > 0) {
            indicadorTiempo = `<span style="color:#28a745; font-size:12px; margin-left:8px;">⏱️ ${minutosRestantes} min para editar</span>`;
        } else if (esAutor && minutosRestantes === 0) {
            indicadorTiempo = `<span style="color:#dc3545; font-size:12px; margin-left:8px;">⏱️ Tiempo expirado</span>`;
        }
        
        return `
            <div class="proyecto-card" data-proyecto-id="${proyecto.ID_proyecto}" data-fecha-creacion="${proyecto.fecha_creacion}">
                <div class="proyecto-header">
                    <span class="proyecto-titulo">${proyecto.nombre || 'Sin título'}</span>
                    <span class="proyecto-etiqueta egresado">${proyecto.rol_autor || 'Usuario'}</span>
                    <span class="proyecto-fecha">${formatearFecha(proyecto.fecha_creacion)}${indicadorTiempo}</span>
                    
                    ${esAutor ? `
                    <div class="proyecto-acciones">
                        <button class="menu-tres-puntos" onclick="toggleProyectoMenu(${proyecto.ID_proyecto}, event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        
                        <div class="menu-desplegable" id="menu-${proyecto.ID_proyecto}">
                            ${puedeEditar ? `
                                <button class="menu-item editar" onclick="editarProyecto(${proyecto.ID_proyecto})">
                                    <i class="fas fa-edit"></i>
                                    Editar
                                </button>
                            ` : `
                                <button class="menu-item editar" disabled style="opacity:0.5; cursor:not-allowed;" title="Tiempo de edición expirado (15 min)">
                                    <i class="fas fa-edit"></i>
                                    Editar (Expirado)
                                </button>
                            `}
                            <button class="menu-item eliminar" onclick="eliminarProyecto(${proyecto.ID_proyecto})">
                                <i class="fas fa-trash"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                    ` : ''}
                    
                    <button class="proyecto-fav"><i class="fa-regular fa-star"></i></button>
                </div>
                
                <div class="proyecto-autor">${proyecto.autor_completo || 'Autor no disponible'}</div>
                <div class="proyecto-carrera">${proyecto.programa_autor || 'Programa no especificado'}</div>
                <div class="proyecto-desc">${proyecto.descripcion || 'Sin descripción'}</div>
                
                ${proyecto.github_url ? `
                    <div class="proyecto-github" style="margin: 8px 0;">
                        <a href="${proyecto.github_url}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: 600;">
                            <i class="fab fa-github"></i> Ver código en GitHub
                        </a>
                    </div>
                ` : ''}
                
                ${proyecto.documento_pdf ? `
                    <div class="proyecto-pdf" style="margin: 8px 0;">
                        <a href="${proyecto.documento_pdf}" target="_blank" style="color: #e53e3e; text-decoration: none; font-weight: 600;">
                            <i class="far fa-file-pdf"></i> Ver documentación PDF
                        </a>
                    </div>
                ` : ''}
                
                <div class="proyecto-footer">
                    <div class="proyecto-comentarios-container" id="comentarios-${proyecto.ID_proyecto}">
                        <span class="proyecto-comentarios" style="cursor:pointer; font-weight:600;" 
                              onclick="toggleComentariosProyecto(${proyecto.ID_proyecto})">
                            Ver comentarios
                        </span>
                        <div class="mini-comentarios" id="mini-comentarios-${proyecto.ID_proyecto}" style="display:none;">
                            <!-- Los comentarios se cargarán aquí -->
                        </div>
                    </div>
                    <a href="/Detalles_Proyecto.html?id=${proyecto.ID_proyecto}" class="btn-abrir">Abrir</a>
                </div>
            </div>
        `;
    }).join('');
    
    // Cargar el contador de comentarios para cada proyecto
    proyectos.forEach(proyecto => {
        cargarComentariosProyecto(proyecto.ID_proyecto);
    });
    
    aplicarEventListenersFavoritos();
    iniciarActualizacionTiempo();
}

// ==================== COMENTARIOS DE PROYECTOS ====================
async function cargarComentariosProyecto(proyectoId) {
    try {
        if (!usuarioActual || !usuarioActual.id) {
            console.log('⚠️ No hay usuario autenticado, no se pueden cargar comentarios');
            return;
        }
        
        const user_id = usuarioActual.id;
        const response = await fetch(`/api/proyectos/${proyectoId}/comentarios?user_id=${user_id}`);
        const data = await response.json();
        
        const contenedor = document.getElementById(`mini-comentarios-${proyectoId}`);
        if (!contenedor) return;
        
        if (data.success && data.comentarios && data.comentarios.length > 0) {
            // Mostrar solo los primeros 2 comentarios
            const comentariosLimitados = data.comentarios.slice(0, 2);
            
            contenedor.innerHTML = comentariosLimitados.map(comentario => `
                <div class="mini-comentario">
                    <strong>${comentario.nombre || 'Usuario'} ${comentario.apellido || ''}:</strong>
                    <span>${comentario.contenido}</span>
                    <small>${formatearFechaMini(comentario.fecha_creacion)}</small>
                </div>
            `).join('');
            
            // Actualizar el texto del botón
            const boton = document.querySelector(`#comentarios-${proyectoId} .proyecto-comentarios`);
            if (boton) {
                boton.textContent = `${data.comentarios.length} comentarios`;
            }
        } else {
            const boton = document.querySelector(`#comentarios-${proyectoId} .proyecto-comentarios`);
            if (boton) {
                boton.textContent = 'No hay comentarios';
            }
        }
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        const boton = document.querySelector(`#comentarios-${proyectoId} .proyecto-comentarios`);
        if (boton) {
            boton.textContent = 'Error al cargar';
        }
    }
}

function toggleComentariosProyecto(proyectoId) {
    const contenedor = document.getElementById(`mini-comentarios-${proyectoId}`);
    if (!contenedor) return;
    
    const estaVisible = contenedor.style.display === 'block';
    
    if (!estaVisible) {
        // Cargar comentarios si no se han cargado
        if (contenedor.innerHTML === '') {
            cargarComentariosProyecto(proyectoId);
        }
        contenedor.style.display = 'block';
    } else {
        contenedor.style.display = 'none';
    }
}

window.toggleComentariosProyecto = toggleComentariosProyecto;

// ==================== FUNCIONES DE TIEMPO ====================
function verificarTiempoEdicion(fechaCreacion) {
    try {
        const ahora = Date.now();
        const fechaCreacionTime = new Date(fechaCreacion).getTime();
        const diferenciaMinutos = (ahora - fechaCreacionTime) / 60000;
        
        return diferenciaMinutos <= 15;
    } catch (error) {
        console.error('Error al verificar tiempo:', error);
        return false;
    }
}

function calcularMinutosRestantes(fechaCreacion) {
    try {
        const ahora = Date.now();
        const fechaCreacionTime = new Date(fechaCreacion).getTime();
        const diferenciaMinutos = (ahora - fechaCreacionTime) / 60000;
        
        return Math.max(0, Math.floor(15 - diferenciaMinutos));
    } catch (error) {
        return 0;
    }
}

let intervaloActualizacion = null;

function iniciarActualizacionTiempo() {
    if (intervaloActualizacion) {
        clearInterval(intervaloActualizacion);
    }
    
    intervaloActualizacion = setInterval(() => {
        document.querySelectorAll('.proyecto-card').forEach(card => {
            const fechaCreacion = card.getAttribute('data-fecha-creacion');
            if (!fechaCreacion) return;
            
            const minutosRestantes = calcularMinutosRestantes(fechaCreacion);
            const fechaSpan = card.querySelector('.proyecto-fecha');
            
            if (fechaSpan) {
                const fechaBase = fechaSpan.textContent.replace(/⏱️.*$/g, '').trim();
                
                if (minutosRestantes > 0) {
                    fechaSpan.innerHTML = `${fechaBase}<span style="color:#28a745; font-size:12px; margin-left:8px;">⏱️ ${minutosRestantes} min para editar</span>`;
                } else {
                    fechaSpan.innerHTML = `${fechaBase}<span style="color:#dc3545; font-size:12px; margin-left:8px;">⏱️ Tiempo expirado</span>`;
                    
                    const menu = card.querySelector('.menu-desplegable');
                    if (menu) {
                        const btnEditar = menu.querySelector('.editar');
                        if (btnEditar && !btnEditar.disabled) {
                            btnEditar.disabled = true;
                            btnEditar.style.opacity = '0.5';
                            btnEditar.style.cursor = 'not-allowed';
                            btnEditar.title = 'Tiempo de edición expirado';
                            btnEditar.innerHTML = '<i class="fas fa-edit"></i> Editar (Expirado)';
                        }
                    }
                }
            }
        });
    }, 60000);
}

// ==================== EDITAR PROYECTO ====================
async function editarProyecto(proyectoId) {
    try {
        console.log('✏️ Editando proyecto:', proyectoId);
        
        const response = await fetch(`/api/proyectos/${proyectoId}`);
        const data = await response.json();
        
        if (data.success && data.proyecto) {
            const proyecto = data.proyecto;
            
            if (proyecto.ID_usuario !== usuarioActual.id) {
                alert('❌ No tienes permisos para editar este proyecto');
                return;
            }
            
            if (!verificarTiempoEdicion(proyecto.fecha_creacion)) {
                const minutosTranscurridos = Math.floor((Date.now() - new Date(proyecto.fecha_creacion).getTime()) / 60000);
                alert(`❌ El tiempo límite para editar este proyecto (15 minutos) ha expirado.\n\nTiempo transcurrido: ${minutosTranscurridos} minutos`);
                return;
            }
            
            // ✅ ASEGURAR QUE edit_user_id ESTÉ ACTUALIZADO
            actualizarUserIdEnFormularios();
            
            document.getElementById('edit_proyecto_id').value = proyectoId;
            document.getElementById('edit_titulo').value = proyecto.nombre || '';
            document.getElementById('edit_descripcion').value = proyecto.descripcion || '';
            document.getElementById('edit_programa').value = proyecto.programa_autor || '';
            document.getElementById('edit_github_url').value = proyecto.github_url || '';
            
            const imagenesContainer = document.getElementById('edit_imagenes_actuales');
            if (proyecto.imagenes && proyecto.imagenes.length > 0) {
                imagenesContainer.innerHTML = `
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                        Imágenes actuales (se mantendrán si no seleccionas nuevas):
                    </div>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${proyecto.imagenes.map(img => `
                            <img src="${img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                        `).join('')}
                    </div>
                `;
            } else {
                imagenesContainer.innerHTML = '<div style="font-size: 12px; color: #666;">No hay imágenes actuales</div>';
            }
            
            const pdfContainer = document.getElementById('edit_pdf_actual');
            if (proyecto.documento_pdf) {
                pdfContainer.innerHTML = `
                    <div style="font-size: 12px; color: #666;">
                        PDF actual: <a href="${proyecto.documento_pdf}" target="_blank" style="color: #10b981;">Ver PDF actual</a>
                    </div>
                `;
            } else {
                pdfContainer.innerHTML = '<div style="font-size: 12px; color: #666;">No hay PDF actual</div>';
            }
            
            document.getElementById('modal-editar-proyecto').style.display = 'flex';
        } else {
            alert('Error al cargar proyecto para editar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar proyecto para editar');
    }
}

window.editarProyecto = editarProyecto;

// ==================== ACTUALIZAR PROYECTO ====================
async function actualizarProyecto(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const submitBtn = document.getElementById('btn-actualizar');
    const proyectoId = document.getElementById('edit_proyecto_id').value;
    
    // ✅ ASEGURAR QUE user_id ESTÉ EN EL FORMDATA
    formData.set('user_id', usuarioActual.id);
    
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/proyectos/${proyectoId}/editar`, {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Proyecto actualizado exitosamente!');
            document.getElementById('modal-editar-proyecto').style.display = 'none';
            this.reset();
            await cargarProyectos();
        } else {
            throw new Error(data.message || 'Error al actualizar proyecto');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al actualizar proyecto: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ==================== ELIMINAR PROYECTO ====================
async function eliminarProyecto(proyectoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto?\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/proyectos/${proyectoId}/eliminar`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: usuarioActual.id })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Proyecto eliminado exitosamente');
            await cargarProyectos();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar proyecto');
    }
}

window.eliminarProyecto = eliminarProyecto;

// ==================== FUNCIONES AUXILIARES ====================
function formatearFecha(fechaString) {
    try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha no disponible';
    }
}

function formatearFechaMini(fechaString) {
    try {
        const fecha = new Date(fechaString);
        const ahora = new Date();
        const diferencia = ahora - fecha;
        const diferenciaMinutos = Math.floor(diferencia / (1000 * 60));
        const diferenciaHoras = Math.floor(diferencia / (1000 * 60 * 60));
        
        if (diferenciaMinutos < 1) {
            return 'Ahora';
        } else if (diferenciaMinutos < 60) {
            return `Hace ${diferenciaMinutos}m`;
        } else if (diferenciaHoras < 24) {
            return `Hace ${diferenciaHoras}h`;
        } else if (fecha.toDateString() === ahora.toDateString()) {
            return 'Hoy';
        } else if (fecha.toDateString() === new Date(ahora - 86400000).toDateString()) {
            return 'Ayer';
        } else {
            return fecha.toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        return '';
    }
}

function toggleProyectoMenu(proyectoId, event) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${proyectoId}`);
    
    if (menuAbierto && menuAbierto !== menu) {
        menuAbierto.classList.remove('mostrar');
    }
    
    menu.classList.toggle('mostrar');
    menuAbierto = menu.classList.contains('mostrar') ? menu : null;
}

window.toggleProyectoMenu = toggleProyectoMenu;

function aplicarEventListenersFavoritos() {
    document.querySelectorAll('.proyecto-fav').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            if (this.classList.contains('active')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
        });
    });
}

function configurarPDFInputs() {
    const pdfLabel = document.querySelector('.pdf-label');
    const pdfInput = document.getElementById('pdf-doc');
    
    if (pdfLabel && pdfInput) {
        pdfLabel.onclick = function() {
            pdfInput.click();
        };
        
        pdfInput.addEventListener('change', function() {
            const pdfName = document.getElementById('pdf-name');
            const pdfPreview = document.getElementById('pdf-preview');
            
            if (this.files.length > 0) {
                pdfName.textContent = 'Archivo seleccionado: ' + this.files[0].name;
                const url = URL.createObjectURL(this.files[0]);
                pdfPreview.innerHTML = `<a href="${url}" target="_blank" style="color:#10b981;font-weight:600;">Ver PDF</a>`;
            } else {
                pdfName.textContent = '';
                pdfPreview.innerHTML = '';
            }
        });
    }
    
    const editPdfLabel = document.querySelector('label[for="edit_pdf-doc"]');
    const editPdfInput = document.getElementById('edit_pdf-doc');
    
    if (editPdfLabel && editPdfInput) {
        editPdfLabel.onclick = function() {
            editPdfInput.click();
        };
        
        editPdfInput.addEventListener('change', function() {
            const pdfName = document.getElementById('edit_pdf-name');
            const pdfPreview = document.getElementById('edit_pdf-preview');
            
            if (this.files.length > 0) {
                pdfName.textContent = 'Nuevo archivo: ' + this.files[0].name;
                const url = URL.createObjectURL(this.files[0]);
                pdfPreview.innerHTML = `<a href="${url}" target="_blank" style="color:#10b981;font-weight:600;">Ver PDF</a>`;
            } else {
                pdfName.textContent = '';
                pdfPreview.innerHTML = '';
            }
        });
    }
}

function configurarNotificaciones() {
    const notiBtn = document.getElementById('notificaciones-btn');
    const notiPopover = document.getElementById('notificaciones-popover');
    
    if (notiBtn && notiPopover) {
        notiBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = notiPopover.style.display === 'block';
            notiPopover.style.display = isVisible ? 'none' : 'block';
            
            // Cerrar menú de perfil si está abierto
            const popoverMenu = document.getElementById('popover-menu');
            if (popoverMenu) {
                popoverMenu.style.display = 'none';
            }
        });
        
        notiPopover.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    document.addEventListener('click', function(e) {
        if (notiPopover && !notiPopover.contains(e.target) && e.target !== notiBtn) {
            notiPopover.style.display = 'none';
        }
    });
}

function limpiarFiltros() {
    document.querySelectorAll('.filtros-form input, .filtros-form select').forEach(function(el) {
        if (!el.disabled) {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
        }
    });
    alert('Filtros limpiados.');
}

// Cerrar menús al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.proyecto-acciones')) {
        document.querySelectorAll('.menu-desplegable').forEach(menu => {
            menu.classList.remove('mostrar');
        });
        menuAbierto = null;
    }
});