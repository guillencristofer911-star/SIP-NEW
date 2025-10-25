// ===== VARIABLES GLOBALES =====
let usuarioActual = null;
let token = null;
let menuComentarioAbierto = null;

// ===== VERIFICAR AUTENTICACIÓN AL CARGAR =====
(function verificarAutenticacion() {
    token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    
    if (!token || !usuarioStr) {
        console.log('❌ No hay sesión activa');
        alert('Debes iniciar sesión para ver los detalles del proyecto');
        window.location.href = '/login';
        return;
    }
    
    try {
        usuarioActual = JSON.parse(usuarioStr);
        console.log('✅ Usuario autenticado:', usuarioActual);
        
        // Actualizar nombre de usuario en el header
        const userNameElement = document.querySelector('.user-name');
        const userAvatarElement = document.querySelector('.user-avatar');
        
        if (userNameElement && usuarioActual.nombre) {
            userNameElement.textContent = usuarioActual.nombre;
        }
        if (userAvatarElement && usuarioActual.nombre) {
            userAvatarElement.textContent = usuarioActual.nombre.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error('Error al parsear usuario:', error);
        alert('Error en la sesión. Por favor inicia sesión nuevamente.');
        window.location.href = '/login';
    }
})();

// ===== CARGAR DATOS DEL PROYECTO =====
async function cargarDetallesProyecto() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const proyectoId = urlParams.get('id');
        
        if (!proyectoId) {
            console.error('No se proporcionó ID de proyecto');
            mostrarProyectoEjemplo();
            return;
        }

        console.log('Cargando detalles del proyecto:', proyectoId);
        
        const response = await fetch(`/api/proyectos/${proyectoId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos del proyecto:', data);
        
        if (data.success && data.proyecto) {
            mostrarDetallesProyecto(data.proyecto);
        } else {
            throw new Error(data.message || 'Error al cargar proyecto');
        }
        
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mostrarProyectoEjemplo();
    }
}

function mostrarDetallesProyecto(proyecto) {
    // Información básica
    document.getElementById('proyecto-titulo').textContent = proyecto.nombre || 'Sin título';
    document.getElementById('proyecto-autor').textContent = 
        proyecto.autor_completo || 
        (proyecto.nombre_autor + ' ' + proyecto.apellido_autor) || 
        'Autor no disponible';
    document.getElementById('proyecto-descripcion').textContent = 
        proyecto.descripcion || 'Sin descripción disponible';
    document.getElementById('proyecto-programa').textContent = 
        proyecto.programa_autor || 'Programa no disponible';
    document.getElementById('proyecto-fecha').textContent = 
        formatearFecha(proyecto.fecha_creacion) || 'Fecha no disponible';

    // GitHub
    const githubElement = document.getElementById('proyecto-github');
    if (proyecto.github_url) {
        githubElement.innerHTML = `<a href="${proyecto.github_url}" target="_blank">Ver código en GitHub</a>`;
    } else {
        githubElement.textContent = 'GitHub no disponible';
    }

    // Imágenes
    cargarImagenesProyecto(proyecto);

    // PDF
    cargarDocumentacionPDF(proyecto);

    // Comentarios
    cargarComentariosProyecto(proyecto);
}

function cargarImagenesProyecto(proyecto) {
    const imagenPrincipal = document.getElementById('imagen-principal');
    const galeriaContenedor = document.getElementById('galeria-contenedor');
    
    galeriaContenedor.innerHTML = '';

    let imagenes = [];

    if (proyecto.imagenes && Array.isArray(proyecto.imagenes)) {
        imagenes = proyecto.imagenes;
    } else if (proyecto.imagen_proyecto && Array.isArray(proyecto.imagen_proyecto)) {
        imagenes = proyecto.imagen_proyecto.map(img => img.ruta_imagen || img.url);
    } else if (proyecto.ruta_imagen || proyecto.imagen_principal) {
        imagenes = [proyecto.ruta_imagen || proyecto.imagen_principal];
    }

    console.log('Imágenes a mostrar:', imagenes);

    if (imagenes.length > 0) {
        const primeraImagen = imagenes[0];
        imagenPrincipal.src = primeraImagen.startsWith('/') ? primeraImagen : `/uploads/${primeraImagen}`;
        imagenPrincipal.alt = proyecto.nombre || 'Imagen del proyecto';

        imagenes.forEach((imagen, index) => {
            const imgElement = document.createElement('div');
            imgElement.className = 'galeria-img';
            const rutaCompleta = imagen.startsWith('/') ? imagen : `/uploads/${imagen}`;
            imgElement.innerHTML = `
                <img src="${rutaCompleta}" 
                     alt="Imagen ${index + 1} del proyecto ${proyecto.nombre}" 
                     onclick="cambiarImagenPrincipal('${rutaCompleta}')">
            `;
            galeriaContenedor.appendChild(imgElement);
        });
    } else {
        imagenPrincipal.src = '/img/placeholder-proyecto.png';
        imagenPrincipal.alt = 'Imagen no disponible';
        
        for (let i = 0; i < 4; i++) {
            const imgElement = document.createElement('div');
            imgElement.className = 'galeria-img';
            imgElement.innerHTML = `
                <img src="/img/placeholder-proyecto.png" 
                     alt="Imagen no disponible"
                     onclick="cambiarImagenPrincipal('/img/placeholder-proyecto.png')">
            `;
            galeriaContenedor.appendChild(imgElement);
        }
    }
}

function cargarDocumentacionPDF(proyecto) {
    const seccionDocumentacion = document.getElementById('seccion-documentacion');
    const enlacePDF = document.getElementById('enlace-pdf');
    
    if (proyecto.documento_pdf) {
        seccionDocumentacion.style.display = 'block';
        const rutaPDF = proyecto.documento_pdf.startsWith('/') ? proyecto.documento_pdf : `/uploads/${proyecto.documento_pdf}`;
        enlacePDF.href = rutaPDF;
        enlacePDF.textContent = 'Descargar documentación PDF';
    } else {
        seccionDocumentacion.style.display = 'none';
    }
}

// ===== FUNCIÓN CARGAR COMENTARIOS PARA DETALLES =====
async function cargarComentariosProyecto(proyecto) {
    try {
        const proyectoId = proyecto.ID_proyecto;
        const user_id = usuarioActual.id;
        
        console.log('🔍 Cargando comentarios con user_id:', user_id);
        
        const response = await fetch(`/api/proyectos/${proyectoId}/comentarios?user_id=${user_id}`);
        const data = await response.json();
        
        console.log('📦 Respuesta completa del servidor:', data);
        
        const listaComentarios = document.getElementById('lista-comentarios');
        
        if (data.success && data.comentarios && data.comentarios.length > 0) {
            listaComentarios.innerHTML = data.comentarios.map(comentario => {
                // ✅ USAR fecha_creacion_js que viene del servidor (ya en milisegundos)
                let fechaFormateada = 'Fecha no disponible';
                
                if (comentario.fecha_creacion_js) {
                    fechaFormateada = formatearFechaRelativa(comentario.fecha_creacion_js);
                    console.log(`📅 Comentario ${comentario.ID_comentario}:`, {
                        fecha_creacion_js: comentario.fecha_creacion_js,
                        fechaFormateada: fechaFormateada
                    });
                } else if (comentario.fecha_creacion) {
                    // Fallback: parsear la fecha string
                    fechaFormateada = formatearFecha(comentario.fecha_creacion);
                }
                
                return `
                    <div class="comentario-item" id="comentario-${comentario.ID_comentario}">
                        <div class="comentario-header">
                            <div class="comentario-info">
                                <span class="comentario-autor">${comentario.nombre || 'Usuario'} ${comentario.apellido || ''}</span>
                                <span class="comentario-fecha">${fechaFormateada}</span>
                            </div>
                            
                            ${comentario.es_autor ? `
                            <div class="comentario-acciones">
                                <button class="menu-tres-puntos" onclick="toggleComentarioMenu(${comentario.ID_comentario}, event)">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                
                                <div class="menu-desplegable" id="menu-comentario-${comentario.ID_comentario}">
                                    <button class="menu-item editar" onclick="editarComentario(${comentario.ID_comentario})">
                                        <i class="fas fa-edit"></i>
                                        Editar
                                    </button>
                                    <button class="menu-item eliminar" onclick="eliminarComentario(${comentario.ID_comentario})">
                                        <i class="fas fa-trash"></i>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <div class="comentario-acciones">
                                <button class="menu-tres-puntos" onclick="mostrarReportarComentarioModal(${comentario.ID_comentario})">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                            </div>
                            `}
                        </div>
                        
                        <div class="comentario-contenido" id="texto-comentario-${comentario.ID_comentario}">
                            ${comentario.contenido}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaComentarios.innerHTML = `
                <div class="sin-comentarios">
                    <i class="far fa-comments"></i>
                    <p>No hay comentarios aún</p>
                    <small>Sé el primero en comentar</small>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        document.getElementById('lista-comentarios').innerHTML = `
            <div class="error-comentarios">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar comentarios</p>
            </div>
        `;
    }
}

// ===== FUNCIONES PARA COMENTARIOS =====
function toggleComentarioMenu(comentarioId, event) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-comentario-${comentarioId}`);
    
    if (menuComentarioAbierto && menuComentarioAbierto !== menu) {
        menuComentarioAbierto.classList.remove('mostrar');
    }
    
    menu.classList.toggle('mostrar');
    menuComentarioAbierto = menu.classList.contains('mostrar') ? menu : null;
}

document.addEventListener('click', function(e) {
    if (menuComentarioAbierto && !e.target.closest('.comentario-acciones')) {
        menuComentarioAbierto.classList.remove('mostrar');
        menuComentarioAbierto = null;
    }
});

function editarComentario(comentarioId) {
    const comentarioTexto = document.getElementById(`texto-comentario-${comentarioId}`).innerText;
    
    document.getElementById('edit_comentario_id').value = comentarioId;
    document.getElementById('editar-comentario-texto').value = comentarioTexto;
    document.getElementById('edit-contador').textContent = comentarioTexto.length;
    
    document.getElementById('modal-editar-comentario').style.display = 'flex';
    
    if (menuComentarioAbierto) {
        menuComentarioAbierto.classList.remove('mostrar');
        menuComentarioAbierto = null;
    }
}

async function eliminarComentario(comentarioId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const user_id = usuarioActual.id;
        
        console.log('🗑️ Eliminando comentario con user_id:', user_id);
        
        const response = await fetch(`/api/comentarios/${comentarioId}/eliminar`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Comentario eliminado exitosamente');
            cargarDetallesProyecto();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar comentario');
    }
    
    if (menuComentarioAbierto) {
        menuComentarioAbierto.classList.remove('mostrar');
        menuComentarioAbierto = null;
    }
}

// Manejar envío del formulario de edición de comentario
document.getElementById('form-editar-comentario').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const comentarioId = document.getElementById('edit_comentario_id').value;
    const nuevoTexto = document.getElementById('editar-comentario-texto').value.trim();
    const submitBtn = document.getElementById('btn-editar-comentario-publicar');
    
    if (!nuevoTexto) {
        alert('Por favor escribe un comentario');
        return;
    }
    
    if (nuevoTexto.length > 100) {
        alert('❌ El comentario no puede tener más de 100 caracteres');
        return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    submitBtn.disabled = true;
    
    try {
        const user_id = usuarioActual.id;
        
        console.log('✏️ Editando comentario con user_id:', user_id);
        
        const response = await fetch(`/api/comentarios/${comentarioId}/editar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                contenido: nuevoTexto,
                user_id: user_id
            })
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            alert('✅ Comentario actualizado exitosamente!');
            document.getElementById('modal-editar-comentario').style.display = 'none';
            cargarDetallesProyecto();
        } else {
            throw new Error(data.message || 'Error al actualizar comentario');
        }
        
    } catch (error) {
        console.error('Error al actualizar comentario:', error);
        alert('❌ Error al actualizar comentario: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Contador de caracteres para editar comentario
document.getElementById('editar-comentario-texto').addEventListener('input', function() {
    const texto = this.value;
    const contador = document.getElementById('edit-contador');
    contador.textContent = texto.length;
    
    if (texto.length > 100) {
        contador.style.color = '#e53e3e';
        contador.style.fontWeight = 'bold';
    } else {
        contador.style.color = '#666';
        contador.style.fontWeight = 'normal';
    }
});

// Cerrar modal de edición de comentario
document.getElementById('btn-editar-comentario-cancelar').onclick = function() {
    document.getElementById('modal-editar-comentario').style.display = 'none';
};

document.getElementById('modal-editar-comentario').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
});

// Función para cambiar la imagen principal
function cambiarImagenPrincipal(src) {
    document.getElementById('imagen-principal').src = src;
}

// ✅ NUEVA FUNCIÓN: Formatear fecha usando timestamp en milisegundos
function formatearFechaRelativa(timestampMs) {
    try {
        const ahora = Date.now();
        const fecha = new Date(timestampMs);
        
        // Validar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
            console.error('❌ Timestamp inválido:', timestampMs);
            return 'Fecha inválida';
        }
        
        const diferencia = ahora - timestampMs;
        const diferenciaSegundos = Math.floor(diferencia / 1000);
        const diferenciaMinutos = Math.floor(diferencia / (1000 * 60));
        const diferenciaHoras = Math.floor(diferencia / (1000 * 60 * 60));
        const diferenciaDias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        
        console.log('⏱️ Cálculo de tiempo:', {
            ahora: ahora,
            timestampMs: timestampMs,
            diferencia: diferencia,
            diferenciaSegundos: diferenciaSegundos,
            diferenciaMinutos: diferenciaMinutos,
            diferenciaHoras: diferenciaHoras,
            fecha: fecha.toISOString()
        });
        
        if (diferenciaSegundos < 60) {
            return 'Ahora mismo';
        } else if (diferenciaMinutos < 60) {
            return `Hace ${diferenciaMinutos} minuto${diferenciaMinutos > 1 ? 's' : ''}`;
        } else if (diferenciaHoras < 24) {
            return `Hace ${diferenciaHoras} hora${diferenciaHoras > 1 ? 's' : ''}`;
        } else if (diferenciaDias === 0) {
            return `Hoy a las ${fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        } else if (diferenciaDias === 1) {
            return `Ayer a las ${fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        } else {
            return fecha.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
    } catch (error) {
        console.error('Error formateando fecha relativa:', error);
        return 'Fecha no disponible';
    }
}

// Función para formatear fecha con hora actualizada y formato relativo
function formatearFecha(fechaString) {
    try {
        const fecha = new Date(fechaString);
        const ahora = new Date();
        const diferencia = ahora - fecha;
        const diferenciaMinutos = Math.floor(diferencia / (1000 * 60));
        const diferenciaHoras = Math.floor(diferencia / (1000 * 60 * 60));
        
        if (diferenciaMinutos < 1) {
            return 'Ahora mismo';
        } else if (diferenciaMinutos < 60) {
            return `Hace ${diferenciaMinutos} minuto${diferenciaMinutos > 1 ? 's' : ''}`;
        } else if (diferenciaHoras < 24) {
            return `Hace ${diferenciaHoras} hora${diferenciaHoras > 1 ? 's' : ''}`;
        } else if (fecha.toDateString() === ahora.toDateString()) {
            return `Hoy a las ${fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        } else if (fecha.toDateString() === new Date(ahora - 86400000).toDateString()) {
            return `Ayer a las ${fecha.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        } else {
            return fecha.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'Fecha no disponible';
    }
}

function mostrarProyectoEjemplo() {
    document.getElementById('proyecto-titulo').textContent = 'Proyecto de Ejemplo';
    document.getElementById('proyecto-autor').textContent = 'Usuario Ejemplo';
    document.getElementById('proyecto-descripcion').textContent = 'No se pudo cargar la información del proyecto.';
    document.getElementById('proyecto-programa').textContent = 'Programa no disponible';
}

// ===== FUNCIONALIDADES EXISTENTES =====

// Menú de notificaciones popover
const notiBtn = document.getElementById('notificaciones-btn');
const notiPopover = document.getElementById('notificaciones-popover');
if (notiBtn && notiPopover) {
    notiBtn.onclick = function(e) {
        e.stopPropagation();
        notiPopover.style.display = notiPopover.style.display === 'block' ? 'none' : 'block';
    };
    notiPopover.onclick = function(e) {
        e.stopPropagation();
    };
    document.addEventListener('click', function(e) {
        if (!notiPopover.contains(e.target) && e.target !== notiBtn) {
            notiPopover.style.display = 'none';
        }
    });
}

// Menú Popover Usuario
const perfilBtn = document.getElementById('perfil-btn');
const popoverMenu = document.getElementById('popover-menu');
if (perfilBtn && popoverMenu) {
    perfilBtn.addEventListener('click', function(e) {
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
        if (!popoverMenu.contains(e.target) && e.target !== perfilBtn) {
            popoverMenu.style.display = 'none';
        }
    });
}

// Botón cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        alert('Sesión cerrada.');
        window.location.href = '/login';
    });
}

// Opciones del menú
document.querySelectorAll('.popover-list li').forEach((li, idx) => {
    li.addEventListener('click', () => {
        switch(idx) {
            case 0: alert('Ir al Perfil'); break;
            case 1: alert('Ir a Configuración'); break;
            case 2: alert('Ir a Favoritos'); break;
            case 3: alert('Ir a Ayuda'); break;
        }
        if (popoverMenu) popoverMenu.style.display = 'none';
    });
});

// Mostrar modal de reporte
function mostrarReportarComentarioModal(comentarioId) {
    const modal = document.getElementById('modal-reportar-comentario');
    if (modal) {
        modal.style.display = 'flex';
        modal.dataset.comentarioId = comentarioId;
    }
}

// Cerrar modal de reporte
const btnCancelarReporte = document.getElementById('btn-cancelar-reporte');
if (btnCancelarReporte) {
    btnCancelarReporte.onclick = function() {
        document.getElementById('modal-reportar-comentario').style.display = 'none';
    };
}

// ===== CONTADOR DE CARACTERES PARA COMENTARIOS =====
const textoComentario = document.getElementById('texto-comentario');
if (textoComentario) {
    textoComentario.addEventListener('input', function() {
        const texto = this.value;
        const contador = document.getElementById('contador');
        if (contador) {
            contador.textContent = texto.length;
            
            if (texto.length > 100) {
                contador.style.color = '#e53e3e';
                contador.style.fontWeight = 'bold';
            } else {
                contador.style.color = '#666';
                contador.style.fontWeight = 'normal';
            }
        }
    });
}

// Publicar nuevo comentario
const btnPublicarComentario = document.getElementById('btn-publicar-comentario');
if (btnPublicarComentario) {
    btnPublicarComentario.addEventListener('click', async function() {
        const texto = document.getElementById('texto-comentario').value.trim();
        
        if (texto.length > 100) {
            alert('❌ El comentario no puede tener más de 100 caracteres');
            return;
        }
        
        if (!texto) {
            alert('Por favor escribe un comentario');
            return;
        }

        try {
            const proyectoId = new URLSearchParams(window.location.search).get('id');
            const user_id = usuarioActual.id;
            
            console.log('📤 Enviando comentario...', { proyectoId, user_id, texto });
            
            const response = await fetch(`/api/proyectos/${proyectoId}/comentarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contenido: texto,
                    user_id: user_id
                })
            });

            const data = await response.json();
            console.log('Respuesta del servidor:', data);
            
            if (data.success) {
                document.getElementById('texto-comentario').value = '';
                const contador = document.getElementById('contador');
                if (contador) {
                    contador.textContent = '0';
                    contador.style.color = '#666';
                }
                alert('✅ Comentario publicado exitosamente');
                cargarDetallesProyecto();
            } else {
                alert('❌ Error al publicar comentario: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error de conexión al publicar comentario');
        }
    });
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', function() {
    cargarDetallesProyecto();
});