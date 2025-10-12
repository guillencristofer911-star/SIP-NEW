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
        
        // ✅ ACTUALIZAR ID DE USUARIO EN FORMULARIOS
        document.getElementById('user_id').value = usuarioActual.id;
        document.getElementById('edit_user_id').value = usuarioActual.id;
        
        // Actualizar header con info del usuario
        actualizarHeaderUsuario();
        
    } catch (error) {
        console.error('Error al parsear usuario:', error);
        alert('Error en la sesión. Por favor inicia sesión nuevamente.');
        window.location.href = '/login';
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
            e.preventDefault();
            e.stopPropagation();
            
            if (popoverMenu.style.display === 'block') {
                popoverMenu.style.display = 'none';
            } else {
                const rect = perfilBtn.getBoundingClientRect();
                popoverMenu.style.display = 'block';
                popoverMenu.style.position = 'absolute';
                popoverMenu.style.top = (rect.bottom + window.scrollY + 10) + 'px';
                popoverMenu.style.left = (rect.left + rect.width/2 - 160) + 'px';
            }
        });

        document.addEventListener('click', function(e) {
            if (!popoverMenu.contains(e.target) && !perfilBtn.contains(e.target)) {
                popoverMenu.style.display = 'none';
            }
        });

        const menuItems = popoverMenu.querySelectorAll('.popover-list li');
        menuItems.forEach((item, index) => {
            item.style.cursor = 'pointer';
            
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                switch(index) {
                    case 0:
                        window.location.href = '/Sesion_De_Perfil';
                        break;
                    case 1:
                        alert('Configuración - Próximamente');
                        popoverMenu.style.display = 'none';
                        break;
                    case 2:
                        alert('Favoritos - Próximamente');
                        popoverMenu.style.display = 'none';
                        break;
                    case 3:
                        alert('Ayuda - Próximamente');
                        popoverMenu.style.display = 'none';
                        break;
                }
            });
        });

        console.log('✅ Menú popover configurado');
    }
    
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
    document.getElementById('modal-subir-proyecto').addEventListener('click', function(e) {
        if (e.target === this) this.style.display = 'none';
    });
    
    document.getElementById('modal-editar-proyecto').addEventListener('click', function(e) {
        if (e.target === this) this.style.display = 'none';
    });
    
    // Formulario de subir proyecto
    document.getElementById('form-subir-proyecto').addEventListener('submit', subirProyecto);
    
    // Formulario de editar proyecto
    document.getElementById('form-editar-proyecto').addEventListener('submit', actualizarProyecto);
    
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
function cerrarSesion() {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    alert('Sesión cerrada exitosamente');
    window.location.href = '/login';
}

// ==================== FUNCIONES DE TIEMPO ====================
function verificarTiempoEdicion(fechaCreacion) {
    try {
        const ahora = Date.now();
        const fechaCreacionTime = new Date(fechaCreacion).getTime();
        const diferenciaMinutos = (ahora - fechaCreacionTime) / 60000;
        
        console.log(`⏱️ Verificando tiempo: ${diferenciaMinutos.toFixed(2)} minutos transcurridos`);
        
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
    
    console.log('⏱️ Actualizador de tiempo iniciado');
}

// ==================== SUBIR PROYECTO ====================
async function subirProyecto(e) {
    e.preventDefault();
    
    if (!usuarioActual || !token) {
        alert('❌ Debes iniciar sesión para subir proyectos');
        window.location.href = '/login';
        return;
    }
    
    const formData = new FormData(this);
    const submitBtn = document.getElementById('btn-publicar');
    
    formData.set('user_id', usuarioActual.id);
    
    console.log('📤 Enviando proyecto con user_id:', usuarioActual.id);
    
    const titulo = formData.get('titulo');
    const descripcion = formData.get('descripcion');
    const programa = formData.get('programa');
    
    if (!titulo || !descripcion || !programa) {
        alert('❌ Por favor completa todos los campos requeridos');
        return;
    }
    
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
    submitBtn.disabled = true;
    
    try {
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
                    <span class="proyecto-comentarios" style="cursor:pointer; font-weight:600;">No hay comentarios</span>
                    <button class="btn-abrir" onclick="abrirProyecto(${proyecto.ID_proyecto})">Abrir</button>
                </div>
            </div>
        `;
    }).join('');
    
    aplicarEventListenersFavoritos();
    iniciarActualizacionTiempo();
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

function abrirProyecto(proyectoId) {
    alert(`Abriendo proyecto ${proyectoId} - Esta funcionalidad se implementará después`);
}

window.abrirProyecto = abrirProyecto;

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
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
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

document.addEventListener('click', function(e) {
    if (!e.target.closest('.proyecto-acciones')) {
        document.querySelectorAll('.menu-desplegable').forEach(menu => {
            menu.classList.remove('mostrar');
        });
        menuAbierto = null;
    }
});

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('¿Estás seguro de cerrar sesión?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                alert('Sesión cerrada exitosamente');
                window.location.href = '/login';
            }
        });
    };