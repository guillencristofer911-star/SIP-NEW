// VARIABLES GLOBALES
let usuarioActual = null;
let token = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Perfil cargado');
    verificarAutenticacion();
    configurarEventListeners();
    cargarDatosPerfil();
    cargarHistorial();
});

// AUTENTICACIÓN
function verificarAutenticacion() {
    token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    
    if (!token || !usuarioStr) {
        console.log('❌ Sin sesión');
        window.location.href = '/login';
        return;
    }
    
    try {
        usuarioActual = JSON.parse(usuarioStr);
        console.log('✅ Usuario:', usuarioActual);
        actualizarHeaderUsuario();
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '/login';
    }
}

function actualizarHeaderUsuario() {
    const userNameElement = document.querySelector('.user-name');
    const userAvatarElement = document.querySelector('.user-avatar');
    
    if (userNameElement && usuarioActual) {
        const nombreCorto = usuarioActual.nombre_corto || 
                           usuarioActual.nombre?.split(' ')[0] || 
                           'Usuario';
        userNameElement.textContent = nombreCorto;
    }
    
    if (userAvatarElement && usuarioActual) {
        const inicial = (usuarioActual.nombre?.charAt(0) || 'U').toUpperCase();
        userAvatarElement.textContent = inicial;
    }
}

// CARGAR PERFIL
async function cargarDatosPerfil() {
    try {
        const response = await fetch('/api/usuario/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarDatosPerfil(data.usuario);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function mostrarDatosPerfil(usuario) {
    const perfilAvatar = document.querySelector('.perfil-avatar');
    if (perfilAvatar) {
        perfilAvatar.textContent = usuario.nombre.charAt(0).toUpperCase();
    }
    
    const perfilNombre = document.querySelector('.perfil-nombre');
    if (perfilNombre) {
        perfilNombre.textContent = `${usuario.nombre} ${usuario.apellido}`;
    }
    
    const perfilEtiqueta = document.querySelector('.perfil-etiqueta');
    if (perfilEtiqueta) {
        perfilEtiqueta.textContent = usuario.rol_nombre || 'Usuario';
    }
    
    const perfilDatos = document.querySelector('.perfil-datos');
    if (perfilDatos) {
        perfilDatos.innerHTML = `${usuario.documento}<br>${usuario.correo}<br>${usuario.programa}`;
    }
}

// CARGAR HISTORIAL
async function cargarHistorial() {
    try {
        const [resPub, resProy] = await Promise.all([
            fetch(`/api/publicaciones?user_id=${usuarioActual.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/api/proyectos?user_id=${usuarioActual.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const dataPub = await resPub.json();
        const dataProy = await resProy.json();
        
        const historial = [];
        
        if (dataPub.success && dataPub.publicaciones) {
            historial.push(...dataPub.publicaciones.map(p => ({...p, tipo: 'publicacion'})));
        }
        
        if (dataProy.success && dataProy.proyectos) {
            historial.push(...dataProy.proyectos.map(p => ({...p, tipo: 'proyecto'})));
        }
        
        historial.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        mostrarHistorial(historial);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

function mostrarHistorial(items) {
    const container = document.querySelector('.perfil-historial');
    
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<h2 class="perfil-historial-titulo">Mi Historial</h2><p>No hay elementos</p>';
        return;
    }
    
    const html = items.map(item => {
        const titulo = item.tipo === 'publicacion' ? item.titulo : item.nombre;
        const desc = item.tipo === 'publicacion' ? item.contenido : item.descripcion;
        const url = item.tipo === 'publicacion' 
            ? `/publicaciones?id=${item.ID_publicacion}` 
            : `/Detalles_Proyecto.html?id=${item.ID_proyecto}`;
        const id = item.tipo === 'publicacion' ? item.ID_publicacion : item.ID_proyecto;
        
        return `
            <div class="historial-card">
                <div class="historial-titulo">${escapeHtml(titulo)}</div>
                <div class="historial-info">
                    ${usuarioActual.nombre} ${usuarioActual.apellido}
                    <span class="perfil-etiqueta">${usuarioActual.rol_nombre}</span>
                    <span class="historial-fecha">${formatearFecha(item.fecha_creacion)}</span>
                </div>
                <div class="historial-carrera">${escapeHtml(item.programa || usuarioActual.programa)}</div>
                <div class="historial-desc">${escapeHtml(desc.substring(0, 150))}${desc.length > 150 ? '...' : ''}</div>
                <button class="btn-abrir" onclick="window.location.href='${url}'">Abrir</button>
                <button class="btn-papelera" onclick="eliminarItem('${item.tipo}', ${id})" title="Eliminar">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = '<h2 class="perfil-historial-titulo">Mi Historial</h2>' + html;
}

// EVENT LISTENERS
function configurarEventListeners() {
    configurarMenuPerfil();
    configurarNotificaciones();
    configurarEliminarCuenta();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }
}

function configurarMenuPerfil() {
    const perfilBtn = document.getElementById('perfil-btn');
    const popoverMenu = document.getElementById('popover-menu');
    
    if (!perfilBtn || !popoverMenu) return;
    
    perfilBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = popoverMenu.style.display === 'block';
        popoverMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    const menuItems = document.querySelectorAll('.popover-list li');
    const rutas = ['/perfil', '/configuracion', '/favoritos', '/ayuda'];
    
    menuItems.forEach((li, idx) => {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            if (rutas[idx]) window.location.href = rutas[idx];
            popoverMenu.style.display = 'none';
        });
    });
    
    document.addEventListener('click', function(e) {
        if (!popoverMenu.contains(e.target) && !perfilBtn.contains(e.target)) {
            popoverMenu.style.display = 'none';
        }
    });
}

function configurarNotificaciones() {
    const notifBtn = document.getElementById('notificaciones-btn');
    const notifPopover = document.getElementById('notificaciones-popover');
    
    if (!notifBtn || !notifPopover) return;
    
    notifBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = notifPopover.style.display === 'block';
        notifPopover.style.display = isVisible ? 'none' : 'block';
    });
    
    document.addEventListener('click', function(e) {
        if (!notifPopover.contains(e.target) && e.target !== notifBtn) {
            notifPopover.style.display = 'none';
        }
    });
}

function configurarEliminarCuenta() {
    const btnEliminar = document.getElementById('btn-eliminar-cuenta');
    const modal = document.getElementById('modal-eliminar-cuenta');
    const btnCancelar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
    
    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => modal.style.display = 'flex');
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => modal.style.display = 'none');
    }
    
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', eliminarCuenta);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }
}

async function eliminarCuenta() {
    try {
        const response = await fetch('/api/usuario/eliminar', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ confirmacion: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cuenta eliminada');
            localStorage.clear();
            window.location.href = '/login';
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar cuenta');
    }
}

window.eliminarItem = async function(tipo, id) {
    if (!confirm(`¿Eliminar este ${tipo}?`)) return;
    
    try {
        const url = tipo === 'publicacion' 
            ? `/api/publicaciones/${id}` 
            : `/api/proyectos/${id}/eliminar`;
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: usuarioActual.id })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Eliminado');
            cargarHistorial();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        localStorage.clear();
        window.location.href = '/login';
    }
}

// UTILIDADES
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(text) {
    const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
    return text.replace(/[&<>"']/g, m => map[m]);
}
