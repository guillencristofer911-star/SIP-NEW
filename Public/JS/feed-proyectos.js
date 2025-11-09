// ==================== VARIABLES GLOBALES ====================
let usuarioActual = null;
let token = null;
let menuAbierto = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación de proyectos...');
    
    verificarAutenticacion();
    configurarEventListeners();
    cargarProyectos();
    
    // 🔥 CONFIGURAR BÚSQUEDA (COPIADO DE PUBLICACIONES)
    configurarBusqueda();
    
    setInterval(actualizarContadoresTiempo, 60000);
});

// ==================== AUTENTICACIÓN ====================
function verificarAutenticacion() {
    token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    
    if (!token || !usuarioStr) {
        console.log('❌ No hay sesión activa, redirigiendo al login...');
        window.location.href = '/login';
        return;
    }
    
    try {
        usuarioActual = JSON.parse(usuarioStr);
        console.log('✅ Usuario autenticado:', usuarioActual);
        actualizarHeaderUsuario();
    } catch (error) {
        console.error('Error al parsear usuario:', error);
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
    }
    
    document.addEventListener('click', function(e) {
        if (popoverMenu && !popoverMenu.contains(e.target) && e.target !== perfilBtn) {
            popoverMenu.style.display = 'none';
        }
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }
    
    configurarModalProyecto();
    configurarModalEdicion();
    configurarNotificaciones();
}

// ==================== CERRAR SESIÓN ====================
function cerrarSesion() {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
}

// ==================== MODAL DE PROYECTO ====================
function configurarModalProyecto() {
    const btnSubir = document.querySelector('.btn-subir');
    const btnPublicar = document.getElementById('btn-publicar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const modalProyecto = document.getElementById('modal-subir-proyecto');

    if (btnSubir) {
        btnSubir.addEventListener('click', function() {
            console.log('📝 Abriendo modal de proyecto...');
            modalProyecto.style.display = 'flex';
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function(e) {
            e.preventDefault();
            modalProyecto.style.display = 'none';
            limpiarFormularioProyecto();
        });
    }

    if (modalProyecto) {
        modalProyecto.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                limpiarFormularioProyecto();
            }
        });
    }

    if (btnPublicar) {
        btnPublicar.addEventListener('click', async function(e) {
            e.preventDefault();
            await crearProyecto();
        });
    }
}

async function crearProyecto() {
    const formData = new FormData(document.getElementById('form-subir-proyecto'));
    
    if (!usuarioActual) {
        alert('Debes iniciar sesión');
        return;
    }
    
    formData.set('user_id', usuarioActual.id);
    
    const titulo = formData.get('titulo');
    const descripcion = formData.get('descripcion');
    const programa = formData.get('programa');

    console.log('📤 Intentando crear proyecto:', { titulo, descripcion, programa });

    if (!titulo || !descripcion || !programa) {
        alert('Todos los campos son obligatorios');
        return;
    }

    try {
        const response = await fetch('/api/proyectos/crear', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);

        if (data.success) {
            document.getElementById('modal-subir-proyecto').style.display = 'none';
            limpiarFormularioProyecto();
            
            await cargarProyectos();
            
            setTimeout(() => {
                const primerProyecto = document.querySelector('.proyecto-card');
                if (primerProyecto) {
                    primerProyecto.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    primerProyecto.style.backgroundColor = '#e8f5e9';
                    setTimeout(() => {
                        primerProyecto.style.backgroundColor = '';
                    }, 2000);
                }
            }, 100);
        } else {
            alert(data.message || 'Error al crear el proyecto');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error de conexión con el servidor');
    }
}

function limpiarFormularioProyecto() {
    document.getElementById('form-subir-proyecto').reset();
    document.getElementById('pdf-name').textContent = '';
    document.getElementById('pdf-preview').innerHTML = '';
}

// ==================== CARGAR PROYECTOS ====================
async function cargarProyectos() {
    console.log('📖 Cargando proyectos...');
    
    const listaProyectos = document.getElementById('proyectos-lista');
    
    if (!listaProyectos) {
        console.error('❌ No se encontró el contenedor de proyectos');
        return;
    }

    listaProyectos.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa fa-spinner fa-spin" style="font-size:24px;"></i><br>Cargando proyectos...</div>';
    
    try {
        const response = await fetch('/api/proyectos');
        const data = await response.json();

        console.log('📥 Proyectos recibidos:', data);

        if (data.success && data.proyectos && data.proyectos.length > 0) {
            renderizarProyectos(data.proyectos);
        } else {
            console.log('🔭 No hay proyectos');
            listaProyectos.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa fa-inbox" style="font-size:48px; opacity:0.3;"></i><br><br>No hay proyectos aún.<br>¡Sé el primero en publicar!</div>';
        }
    } catch (error) {
        console.error('❌ Error al cargar proyectos:', error);
        listaProyectos.innerHTML = '<div style="text-align:center; padding:40px; color:#dc3545;"><i class="fa fa-exclamation-triangle"></i> Error al cargar los proyectos. Por favor recarga la página.</div>';
    }
}

// ==================== 🔥 FUNCIÓN UNIFICADA PARA RENDERIZAR PROYECTOS ====================
function renderizarProyectos(proyectos) {
    const listaProyectos = document.getElementById('proyectos-lista');
    
    if (!listaProyectos) {
        console.error('❌ No se encontró el contenedor #proyectos-lista');
        return;
    }

    console.log('🎨 Renderizando', proyectos.length, 'proyectos');

    // 🔥 LIMPIAR COMPLETAMENTE EL CONTENEDOR
    listaProyectos.innerHTML = '';

    // Si no hay resultados
    if (!proyectos || proyectos.length === 0) {
        console.log('⚠️ No hay proyectos para mostrar');
        listaProyectos.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#666; background:white; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <i class="fa fa-search" style="font-size:64px; opacity:0.3; color:#10b981; margin-bottom:20px;"></i>
                <h3 style="color:#184C3A; margin-bottom:10px;">No se encontraron proyectos</h3>
                <p style="color:#666;">Intenta con otros criterios de búsqueda</p>
            </div>
        `;
        return;
    }

    // 🔥 RENDERIZAR CADA PROYECTO
    proyectos.forEach((proyecto, index) => {
        console.log(`📝 Renderizando proyecto ${index + 1}:`, proyecto.nombre);
        
        const esAutor = usuarioActual && usuarioActual.id === proyecto.ID_usuario;
        const puedeEditarProyecto = esAutor && verificarTiempoEdicion(proyecto.fecha_creacion);
        const tiempoRestante = calcularMinutosRestantes(proyecto.fecha_creacion);
        
        let rolMostrar = 'Usuario';
        
        if (proyecto.rol_autor) {
            rolMostrar = proyecto.rol_autor.charAt(0).toUpperCase() + proyecto.rol_autor.slice(1).toLowerCase();
        } else if (proyecto.ID_rol) {
            const rolesMap = {
                1: 'Admin',
                2: 'Aprendiz',
                3: 'Egresado'
            };
            rolMostrar = rolesMap[proyecto.ID_rol] || 'Usuario';
        }
        
        console.log(`📋 Proyecto ${proyecto.ID_proyecto}: Rol = ${rolMostrar}`);
        
        let indicadorTiempo = '';
        if (esAutor && tiempoRestante > 0) {
            indicadorTiempo = `<span style="color:#28a745; font-size:12px; margin-left:8px;">⏱️ ${tiempoRestante} min para editar</span>`;
        }
        
        const proyectoHTML = `
            <div class="proyecto-card" 
                 data-id="${proyecto.ID_proyecto}" 
                 data-timestamp="${Math.floor(new Date(proyecto.fecha_creacion).getTime() / 1000)}">
                <div class="proyecto-header">
                    <span class="proyecto-titulo">${escapeHtml(proyecto.nombre)}</span>
                    <span class="proyecto-fecha">${formatearFecha(proyecto.fecha_creacion)}${indicadorTiempo}</span>
                    <button class="proyecto-fav" type="button"><i class="fa-regular fa-star"></i></button>
                    ${esAutor ? `
                        <button class="publicacion-menu-btn" onclick="toggleProyectoMenu(this)">...</button>
                        <div class="publicacion-menu" style="display:none;">
                            <div class="popover-arrow"></div>
                            ${puedeEditarProyecto ? `
                                <button class="menu-btn editar" onclick="editarProyecto(${proyecto.ID_proyecto})">Editar</button>
                            ` : `
                                <button disabled style="opacity:0.5; cursor:not-allowed;" title="Tiempo de edición expirado (15 min)">Editar (Expirado)</button>
                            `}
                            <button class="menu-btn eliminar" onclick="eliminarProyecto(${proyecto.ID_proyecto})">Eliminar</button>
                        </div>
                    ` : ''}
                </div>
                <div class="proyecto-autor">
                    ${escapeHtml(proyecto.autor_completo || proyecto.nombre_autor + ' ' + proyecto.apellido_autor)}
                    <span class="proyecto-etiqueta egresado">${rolMostrar}</span>
                </div>
                <div class="proyecto-carrera">${escapeHtml(proyecto.programa_autor || 'Sin programa')}</div>
                <div class="proyecto-desc">
                    ${escapeHtml(proyecto.descripcion)}
                </div>
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
                    <span class="proyecto-comentarios">No hay comentarios</span>
                    <button class="btn-abrir" type="button" onclick="abrirProyecto(${proyecto.ID_proyecto})">Abrir</button>
                </div>
            </div>
        `;
        
        // 🔥 AGREGAR AL CONTENEDOR
        listaProyectos.insertAdjacentHTML('beforeend', proyectoHTML);
    });

    console.log('✅ Renderizado completado');
    aplicarEventListenersFavoritos();
}

// ==================== EDITAR PROYECTO ====================
function configurarModalEdicion() {
    const btnEditarPublicar = document.getElementById('btn-actualizar');
    const btnEditarCancelar = document.getElementById('btn-cancelar-edicion');
    const modalEditar = document.getElementById('modal-editar-proyecto');

    if (btnEditarCancelar) {
        btnEditarCancelar.addEventListener('click', function(e) {
            e.preventDefault();
            modalEditar.style.display = 'none';
        });
    }

    if (modalEditar) {
        modalEditar.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }

    if (btnEditarPublicar) {
        btnEditarPublicar.addEventListener('click', async function(e) {
            e.preventDefault();
            await guardarEdicionProyecto();
        });
    }
}

window.editarProyecto = async function(id) {
    console.log('✏️ Editando proyecto:', id);
    
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
        const timestamp = parseInt(card.getAttribute('data-timestamp'));
        if (!puedeEditar(timestamp)) {
            alert('El tiempo límite para editar este proyecto (15 minutos) ha expirado.');
            return;
        }
    }
    
    try {
        const response = await fetch(`/api/proyectos/${id}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('edit_proyecto_id').value = id;
            document.getElementById('edit_titulo').value = data.proyecto.nombre;
            document.getElementById('edit_descripcion').value = data.proyecto.descripcion;
            document.getElementById('edit_programa').value = data.proyecto.programa_autor;
            document.getElementById('edit_github_url').value = data.proyecto.github_url || '';
            document.getElementById('modal-editar-proyecto').style.display = 'flex';
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al cargar el proyecto');
    }
};

async function guardarEdicionProyecto() {
    const proyectoId = document.getElementById('edit_proyecto_id').value;
    const formData = new FormData(document.getElementById('form-editar-proyecto'));
    
    formData.set('user_id', usuarioActual.id);

    try {
        const response = await fetch(`/api/proyectos/${proyectoId}/editar`, {
            method: 'PUT',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('modal-editar-proyecto').style.display = 'none';
            await cargarProyectos();
            alert('✅ Proyecto actualizado exitosamente');
        } else {
            alert(data.message || 'Error al actualizar el proyecto');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error de conexión con el servidor');
    }
}

// ==================== ELIMINAR PROYECTO ====================
window.eliminarProyecto = async function(id) {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;
    
    try {
        const response = await fetch(`/api/proyectos/${id}/eliminar`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: usuarioActual.id })
        });

        const data = await response.json();

        if (data.success) {
            await cargarProyectos();
            alert('✅ Proyecto eliminado exitosamente');
        } else {
            alert(data.message || 'Error al eliminar el proyecto');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error de conexión con el servidor');
    }
};

// ==================== FUNCIONES DE TIEMPO ====================
function puedeEditar(fechaCreacionTimestamp) {
    try {
        const ahora = Math.floor(Date.now() / 1000);
        const diferenciaSegundos = ahora - fechaCreacionTimestamp;
        const diferenciaMinutos = diferenciaSegundos / 60;
        return diferenciaMinutos <= 15;
    } catch (error) {
        console.error('Error al verificar tiempo:', error);
        return false;
    }
}

function verificarTiempoEdicion(fechaCreacion) {
    try {
        const ahora = Date.now();
        const fechaCreacionTime = new Date(fechaCreacion).getTime();
        const diferenciaMinutos = (ahora - fechaCreacionTime) / 60000;
        return diferenciaMinutos <= 15;
    } catch (error) {
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

function actualizarContadoresTiempo() {
    document.querySelectorAll('.proyecto-card').forEach(card => {
        const timestamp = parseInt(card.getAttribute('data-timestamp'));
        if (!timestamp) return;
        
        const tiempoRestante = Math.max(0, Math.floor(15 - ((Math.floor(Date.now() / 1000) - timestamp) / 60)));
        const fechaSpan = card.querySelector('.proyecto-fecha');
        
        if (fechaSpan) {
            const fechaBase = fechaSpan.textContent.replace(/⏱️.*$/g, '').trim();
            
            if (tiempoRestante > 0) {
                fechaSpan.innerHTML = `${fechaBase}<span style="color:#28a745; font-size:12px; margin-left:8px;">⏱️ ${tiempoRestante} min para editar</span>`;
            } else {
                fechaSpan.innerHTML = `${fechaBase}<span style="color:#dc3545; font-size:12px; margin-left:8px;"></span>`;
                
                const menuBtn = card.querySelector('.publicacion-menu button:not(.eliminar)');
                if (menuBtn && !menuBtn.disabled) {
                    menuBtn.disabled = true;
                    menuBtn.style.opacity = '0.5';
                    menuBtn.style.cursor = 'not-allowed';
                    menuBtn.title = 'Tiempo de edición expirado';
                    menuBtn.textContent = 'Editar (Expirado)';
                }
            }
        }
    });
}

// ==================== UTILIDADES ====================
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', opciones);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== MENÚS Y FAVORITOS ====================
window.toggleProyectoMenu = function(btn) {
    const menu = btn.nextElementSibling;
    const isVisible = menu.style.display === 'flex';
    
    document.querySelectorAll('.publicacion-menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
    
    menu.style.display = isVisible ? 'none' : 'flex';
};

function aplicarEventListenersFavoritos() {
    document.querySelectorAll('.proyecto-fav').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
}

// ==================== NOTIFICACIONES ====================
function configurarNotificaciones() {
    const notifBtn = document.getElementById('notificaciones-btn');
    const notifPopover = document.getElementById('notificaciones-popover');
    
    if (notifBtn && notifPopover) {
        notifBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = notifPopover.style.display === 'block';
            notifPopover.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    document.addEventListener('click', function(e) {
        if (notifPopover && !notifPopover.contains(e.target) && e.target !== notifBtn) {
            notifPopover.style.display = 'none';
        }
    });
}

function abrirProyecto(id) {
    window.location.href = `/Detalles_Proyecto.html?id=${id}`;
}

window.abrirProyecto = abrirProyecto;

document.addEventListener('click', function(e) {
    if (!e.target.closest('.publicacion-menu-btn')) {
        document.querySelectorAll('.publicacion-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// ==================== 🔥 SISTEMA DE BÚSQUEDA (COPIADO DE PUBLICACIONES) ====================

function configurarBusqueda() {
    const inputBusqueda = document.getElementById('input-busqueda');
    const selectPrograma = document.querySelector('.filtros-form select[name="programa"]');
    const inputFecha = document.getElementById('input-fecha');
    const btnLimpiar = document.querySelector('.btn-limpiar');

    console.log('🔧 Configurando búsqueda...', { 
        inputBusqueda: !!inputBusqueda, 
        selectPrograma: !!selectPrograma, 
        inputFecha: !!inputFecha 
    });

    // Búsqueda por palabra clave (presionar Enter)
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('⌨️ Enter presionado, realizando búsqueda...');
                realizarBusqueda();
            }
        });
    }

    // Búsqueda automática por programa
    if (selectPrograma) {
        selectPrograma.addEventListener('change', function() {
            console.log('📚 Programa seleccionado:', this.value);
            realizarBusqueda();
        });
    }

    // Búsqueda automática por fecha
    if (inputFecha) {
        inputFecha.addEventListener('change', function() {
            console.log('📅 Fecha seleccionada:', this.value);
            realizarBusqueda();
        });
    }

    // Limpiar filtros
    if (btnLimpiar) {
        btnLimpiar.removeEventListener('click', limpiarFiltrosBusqueda);
        btnLimpiar.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🧹 Limpiando filtros...');
            limpiarFiltrosBusqueda();
        });
    }
}

async function realizarBusqueda() {
    try {
        const keyword = document.getElementById('input-busqueda')?.value.trim();
        const programa = document.querySelector('.filtros-form select[name="programa"]')?.value;
        const inputFecha = document.getElementById('input-fecha');
        const fecha = inputFecha?.value;

        console.log('🔍 Datos de búsqueda RAW:', { 
            keyword, 
            programa, 
            fecha,
            keywordLength: keyword?.length,
            programaLength: programa?.length,
            fechaValue: inputFecha?.value
        });

        // Si no hay filtros, mostrar todos los proyectos
        if (!keyword && !programa && !fecha) {
            console.log('⚠️ No hay filtros, cargando todos los proyectos');
            await cargarProyectos();
            return;
        }

        // Construir URL con parámetros de búsqueda
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (programa) params.append('programa', programa);
        if (fecha) params.append('fecha', fecha);

        const url = `/api/proyectos/buscar?${params.toString()}`;
        console.log('📡 Llamando a:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('📥 Respuesta del servidor:', data);

        if (data.success) {
            console.log(`✅ ${data.proyectos.length} proyectos encontrados`);
            console.log('📋 Proyectos recibidos:', data.proyectos);
            
            // 🔥 CRÍTICO: Usar la función unificada de renderizado
            renderizarProyectos(data.proyectos);
        } else {
            throw new Error(data.message || 'Error en la búsqueda');
        }

    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        const listaProyectos = document.getElementById('proyectos-lista');
        if (listaProyectos) {
            listaProyectos.innerHTML = `
                <div style="text-align:center; padding:40px; color:#dc3545;">
                    <i class="fa fa-exclamation-triangle" style="font-size:48px;"></i><br><br>
                    <strong>Error al realizar la búsqueda</strong><br>
                    ${error.message}
                </div>
            `;
        }
    }
}

function limpiarFiltrosBusqueda() {
    const inputBusqueda = document.getElementById('input-busqueda');
    const selectPrograma = document.querySelector('.filtros-form select[name="programa"]');
    const inputFecha = document.getElementById('input-fecha');

    console.log('🧹 Limpiando todos los filtros...');

    if (inputBusqueda) {
        inputBusqueda.value = '';
        console.log('✅ Input búsqueda limpiado');
    }
    
    if (selectPrograma) {
        selectPrograma.selectedIndex = 0;
        console.log('✅ Select programa limpiado');
    }
    
    if (inputFecha) {
        inputFecha.value = '';
        console.log('✅ Input fecha limpiado');
    }

    // Recargar todos los proyectos
    console.log('🔄 Recargando todos los proyectos...');
    cargarProyectos();
}

console.log('✅ Script de búsqueda cargado correctamente');