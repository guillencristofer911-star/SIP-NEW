// 🔐 Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando carga de perfil...');
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Debes iniciar sesión para ver tu perfil');
        window.location.href = '/login';
        return;
    }

    await cargarDatosPerfil();
    await cargarHistorialCompleto();
    inicializarEventos();
});

// 📋 Cargar datos del perfil
async function cargarDatosPerfil() {
    try {
        const token = localStorage.getItem('token');
        console.log('📡 Solicitando datos del perfil...');
        
        const response = await fetch('/api/perfil/datos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('📦 Respuesta del servidor:', data);

        if (data.success) {
            const usuario = data.usuario;
            
            // Actualizar avatar (primera letra del nombre)
            const avatarElements = document.querySelectorAll('.perfil-avatar, .user-avatar');
            avatarElements.forEach(el => {
                el.textContent = usuario.nombre.charAt(0).toUpperCase();
            });

            // Actualizar nombre en el menú
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(el => {
                el.textContent = usuario.nombre;
            });

            // Actualizar información del perfil
            const perfilNombre = document.querySelector('.perfil-nombre');
            const perfilEtiqueta = document.querySelector('.perfil-etiqueta');
            const perfilDatos = document.querySelector('.perfil-datos');
            
            if (perfilNombre) perfilNombre.textContent = usuario.nombreCompleto;
            if (perfilEtiqueta) perfilEtiqueta.textContent = capitalizar(usuario.rol);
            
            if (perfilDatos) {
                perfilDatos.innerHTML = `
                    ${usuario.documento}<br>
                    ${usuario.correo}<br>
                    ${usuario.programa}
                `;
            }

            console.log('✅ Datos del perfil cargados');
        } else {
            console.error('❌ Error al cargar perfil:', data.message);
            alert('Error al cargar el perfil: ' + data.message);
        }
    } catch (error) {
        console.error('❌ Error al cargar datos del perfil:', error);
        alert('Error de conexión al cargar el perfil');
    }
}

// 📚 Cargar historial completo (proyectos + publicaciones)
async function cargarHistorialCompleto() {
    try {
        const token = localStorage.getItem('token');
        console.log('📡 Solicitando historial completo...');
        
        const response = await fetch('/api/perfil/historial', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('📦 Historial recibido:', data);

        if (data.success) {
            if (data.historial && data.historial.length > 0) {
                mostrarHistorial(data.historial);
                console.log('✅ Historial cargado:', data.estadisticas);
            } else {
                console.log('ℹ️ No hay items en el historial');
                mostrarMensajeVacio();
            }
        } else {
            console.error('❌ Error al cargar historial:', data.message);
            mostrarMensajeVacio();
        }
    } catch (error) {
        console.error('❌ Error al cargar historial:', error);
        alert('Error de conexión al cargar el historial');
        mostrarMensajeVacio();
    }
}

// 🎨 Mostrar historial en la interfaz
function mostrarHistorial(items) {
    const historialContainer = document.querySelector('.perfil-historial');
    
    if (!historialContainer) {
        console.error('❌ No se encontró el contenedor .perfil-historial');
        return;
    }
    
    // Limpiar contenido excepto el título
    const titulo = historialContainer.querySelector('.perfil-historial-titulo');
    historialContainer.innerHTML = '';
    if (titulo) {
        historialContainer.appendChild(titulo);
    } else {
        // Crear título si no existe
        const nuevoTitulo = document.createElement('h2');
        nuevoTitulo.className = 'perfil-historial-titulo';
        nuevoTitulo.textContent = 'Mi Historial';
        historialContainer.appendChild(nuevoTitulo);
    }

    console.log(`🎨 Mostrando ${items.length} items en el historial`);

    items.forEach((item, index) => {
        console.log(`  - Item ${index + 1}: ${item.tipo} - ${item.titulo}`);
        const card = crearCardHistorial(item);
        historialContainer.appendChild(card);
    });
}

// 🎴 Crear tarjeta de historial
function crearCardHistorial(item) {
    const card = document.createElement('div');
    card.className = 'historial-card';
    card.dataset.id = item.id;
    card.dataset.tipo = item.tipo;

    const fecha = formatearFecha(item.fecha_creacion);
    const rolCapitalizado = capitalizar(item.rol);

    let contenidoAdicional = '';
    let botonesAccion = '';

    if (item.tipo === 'proyecto') {
        // Card de proyecto
        const imagenPreview = item.imagenes && item.imagenes.length > 0 
            ? `<img src="${item.imagenes[0]}" alt="Preview" style="max-width: 150px; max-height: 150px; border-radius: 8px; margin-top: 10px; object-fit: cover;">` 
            : '';
        
        contenidoAdicional = imagenPreview;
        
        botonesAccion = `
            <button class="btn-abrir" onclick="abrirProyecto(${item.id})">
                <i class="fa-solid fa-folder-open"></i> Abrir
            </button>
            <button class="btn-editar-item" onclick="editarProyecto(${item.id})">
                <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button class="btn-papelera" onclick="eliminarProyecto(${item.id})" title="Eliminar proyecto">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;
    } else {
        // Card de publicación
        const estadoEdicion = item.puedeEditar 
            ? `<span style="color: #3ec9a7; font-size: 0.85em; font-weight: 500;">⏱️ Puedes editar (${item.minutosRestantes} min restantes)</span>`
            : `<span style="color: #999; font-size: 0.85em;">🔒 Tiempo de edición expirado</span>`;
        
        contenidoAdicional = `<div style="margin-top: 8px;">${estadoEdicion}</div>`;
        
        botonesAccion = `
            <button class="btn-abrir" onclick="abrirPublicacion(${item.id})">
                <i class="fa-solid fa-eye"></i> Ver
            </button>
            ${item.puedeEditar ? `
                <button class="btn-editar-item" onclick="editarPublicacion(${item.id})">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
            ` : ''}
            <button class="btn-papelera" onclick="eliminarPublicacion(${item.id})" title="Eliminar publicación">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;
    }

    card.innerHTML = `
        <div class="historial-titulo">${escapeHtml(item.titulo)}</div>
        <div class="historial-info">
            ${escapeHtml(item.autor)} <span class="perfil-etiqueta">${rolCapitalizado}</span>
            <span class="historial-fecha">${fecha}</span>
        </div>
        <div class="historial-carrera">${escapeHtml(item.programa)}</div>
        <div class="historial-desc">${escapeHtml(truncarTexto(item.descripcion, 150))}</div>
        ${contenidoAdicional}
        <div class="historial-acciones" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
            ${botonesAccion}
        </div>
    `;

    return card;
}

// 🚫 Mostrar mensaje cuando no hay items
function mostrarMensajeVacio() {
    const historialContainer = document.querySelector('.perfil-historial');
    
    if (!historialContainer) return;
    
    const titulo = historialContainer.querySelector('.perfil-historial-titulo');
    
    historialContainer.innerHTML = '';
    if (titulo) {
        historialContainer.appendChild(titulo);
    }
    
    const mensaje = document.createElement('div');
    mensaje.style.cssText = 'text-align: center; padding: 40px; color: #666;';
    mensaje.innerHTML = `
        <i class="fa-solid fa-folder-open" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i><br>
        <p style="font-size: 1.1em; margin: 10px 0;">Aún no tienes proyectos ni publicaciones</p>
        <p style="font-size: 0.9em; color: #999;">Comienza creando tu primer contenido</p>
    `;
    
    historialContainer.appendChild(mensaje);
}

// 📂 Abrir proyecto (redirigir a página de detalles)
window.abrirProyecto = function(proyectoId) {
    console.log('🔗 Abriendo proyecto:', proyectoId);
    window.location.href = `/proyecto/${proyectoId}`;
};

// 📝 Abrir publicación
window.abrirPublicacion = function(publicacionId) {
    console.log('🔗 Abriendo publicación:', publicacionId);
    window.location.href = `/publicaciones#pub-${publicacionId}`;
};

//  Editar proyecto
window.editarProyecto = function(proyectoId) {
    console.log(' Editando proyecto:', proyectoId);
    window.location.href = `/feed-proyectos?editar=${proyectoId}`;
};

//  Editar publicación
window.editarPublicacion = function(publicacionId) {
    console.log(' Editando publicación:', publicacionId);
    window.location.href = `/publicaciones?editar=${publicacionId}`;
};

// 🗑️ Eliminar proyecto
window.eliminarProyecto = async function(proyectoId) {
    console.log(' Solicitando eliminar proyecto:', proyectoId);
    
    if (!confirm('¿Estás seguro de eliminar este proyecto?\n\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');

        console.log('📡 Enviando solicitud de eliminación...');

        const response = await fetch(`/api/proyectos/${proyectoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userData.id })
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (data.success) {
            alert('Proyecto eliminado exitosamente');
            
            // Eliminar visualmente la tarjeta
            const card = document.querySelector(`.historial-card[data-tipo="proyecto"][data-id="${proyectoId}"]`);
            if (card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    card.remove();
                    // Verificar si quedaron items
                    const cards = document.querySelectorAll('.historial-card');
                    if (cards.length === 0) {
                        mostrarMensajeVacio();
                    }
                }, 300);
            }
            
            // Recargar historial completo
            setTimeout(() => cargarHistorialCompleto(), 500);
        } else {
            alert(' Error: ' + data.message);
        }
    } catch (error) {
        console.error(' Error al eliminar proyecto:', error);
        alert('Error de conexión al eliminar el proyecto');
    }
};

// 🗑️ Eliminar publicación
window.eliminarPublicacion = async function(publicacionId) {
    console.log('🗑️ Solicitando eliminar publicación:', publicacionId);
    
    if (!confirm('¿Estás seguro de eliminar esta publicación?\n\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');

        console.log('📡 Enviando solicitud de eliminación...');

        const response = await fetch(`/api/publicaciones/${publicacionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log(' Respuesta del servidor:', data);

        if (data.success) {
            alert('Publicación eliminada exitosamente');
            
            // Eliminar visualmente la tarjeta
            const card = document.querySelector(`.historial-card[data-tipo="publicacion"][data-id="${publicacionId}"]`);
            if (card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    card.remove();
                    // Verificar si quedaron items
                    const cards = document.querySelectorAll('.historial-card');
                    if (cards.length === 0) {
                        mostrarMensajeVacio();
                    }
                }, 300);
            }
            
            // Recargar historial completo
            setTimeout(() => cargarHistorialCompleto(), 500);
        } else {
            alert(' Error: ' + data.message);
        }
    } catch (error) {
        console.error(' Error al eliminar publicación:', error);
        alert('Error de conexión al eliminar la publicación');
    }
};

// Inicializar eventos de la interfaz
function inicializarEventos() {
    console.log(' Inicializando eventos...');
    
    // Popover de notificaciones
    const notiBtn = document.getElementById('notificaciones-btn');
    const notiPopover = document.getElementById('notificaciones-popover');
    
    if (notiBtn && notiPopover) {
        notiBtn.onclick = function(e) {
            e.stopPropagation();
            notiPopover.style.display = notiPopover.style.display === 'block' ? 'none' : 'block';
        };
        
        document.addEventListener('click', function(e) {
            if (!notiPopover.contains(e.target) && e.target !== notiBtn) {
                notiPopover.style.display = 'none';
            }
        });
    }

    // Popover del menú de usuario
    const perfilBtn = document.getElementById('perfil-btn');
    const popoverMenu = document.getElementById('popover-menu');
    
    if (perfilBtn && popoverMenu) {
        perfilBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            popoverMenu.style.display = popoverMenu.style.display === 'block' ? 'none' : 'block';
            
            if (popoverMenu.style.display === 'block') {
                const rect = perfilBtn.getBoundingClientRect();
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

        // Opciones del menú
        const menuItems = popoverMenu.querySelectorAll('.popover-list li');
        menuItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                switch(index) {
                    case 0: // Perfil
                        window.location.href = '/Sesion_De_Perfil';
                        break;
                    case 1: // Configuración
                        alert('Configuración - Próximamente');
                        break;
                    case 2: // Favoritos
                        alert('Favoritos - Próximamente');
                        break;
                    case 3: // Ayuda
                        alert('Ayuda - Próximamente');
                        break;
                }
                popoverMenu.style.display = 'none';
            });
        });
    }

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
    }

    // Modal de eliminar cuenta
    const btnEliminarCuenta = document.getElementById('btn-eliminar-cuenta');
    const modalEliminar = document.getElementById('modal-eliminar-cuenta');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');

    if (btnEliminarCuenta && modalEliminar) {
        btnEliminarCuenta.addEventListener('click', function() {
            modalEliminar.style.display = 'flex';
        });

        if (btnCancelarEliminar) {
            btnCancelarEliminar.addEventListener('click', function() {
                modalEliminar.style.display = 'none';
            });
        }

        modalEliminar.addEventListener('click', function(e) {
            if (e.target === modalEliminar) {
                modalEliminar.style.display = 'none';
            }
        });
    }
    
    console.log(' Eventos inicializados');
}

//  Utilidades
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const año = date.getFullYear();
    const hora = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    
    return `${dia} ${mes} ${año}, ${hora}:${minutos}`;
}

function truncarTexto(texto, maxLength) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}