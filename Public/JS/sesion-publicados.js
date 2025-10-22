// ========== VARIABLES GLOBALES ==========
let usuarioActual = null;
let token = null;
let publicacionEditandoId = null;

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Iniciando aplicación...');
  
  // Verificar autenticación
  verificarAutenticacion();
  
  // Configurar event listeners
  configurarEventListeners();
  
  // Cargar publicaciones
  cargarPublicaciones();
  
  // Actualizar contadores cada minuto
  setInterval(actualizarContadoresTiempo, 60000);
});

// ========== AUTENTICACIÓN ==========
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

// ========== EVENT LISTENERS ==========
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
  
  // Modal de publicación
  configurarModalPublicacion();
  
  // Modal de edición
  configurarModalEdicion();
  
  // Notificaciones
  configurarNotificaciones();
}

// ========== CERRAR SESIÓN ==========
function cerrarSesion() {
  console.log('👋 Cerrando sesión...');
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/login';
}

// ========== MODAL DE PUBLICACIÓN ==========
function configurarModalPublicacion() {
  const btnSubir = document.querySelector('.btn-subir');
  const btnPublicar = document.getElementById('btn-publicar');
  const btnCancelar = document.getElementById('btn-cancelar');
  const modalPublicacion = document.getElementById('modal-publicacion');
  const modalAdvertencia = document.getElementById('modal-advertencia');
  const btnCerrarAdvertencia = document.getElementById('btn-cerrar-advertencia');

  if (btnSubir) {
    btnSubir.addEventListener('click', function() {
      console.log('📝 Abriendo modal de publicación...');
      modalPublicacion.style.display = 'flex';
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', function(e) {
      e.preventDefault();
      modalPublicacion.style.display = 'none';
      limpiarFormularioPublicacion();
    });
  }

  if (modalPublicacion) {
    modalPublicacion.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
        limpiarFormularioPublicacion();
      }
    });
  }

  if (btnPublicar) {
    btnPublicar.addEventListener('click', async function(e) {
      e.preventDefault();
      await crearPublicacion();
    });
  }
  
  // Modal de advertencia
  if (btnCerrarAdvertencia && modalAdvertencia) {
    btnCerrarAdvertencia.addEventListener('click', function() {
      modalAdvertencia.style.display = 'none';
    });
  }
}

async function crearPublicacion() {
  const titulo = document.getElementById('titulo-publicacion').value.trim();
  const contenido = document.getElementById('desc-publicacion').value.trim();

  console.log('📤 Intentando crear publicación:', { titulo, contenido });

  // Validaciones
  if (!titulo || !contenido) {
    alert('El título y contenido son obligatorios');
    return;
  }

  if (titulo.length < 5 || titulo.length > 100) {
    alert('El título debe tener entre 5 y 100 caracteres');
    return;
  }

  if (contenido.length < 10) {
    alert('El contenido debe tener al menos 10 caracteres');
    return;
  }

  try {
    const response = await fetch('/api/publicaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        titulo: titulo,
        contenido: contenido,
        etiquetas: []
      })
    });

    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);

    if (data.success) {
      // Cerrar modal y limpiar
      document.getElementById('modal-publicacion').style.display = 'none';
      limpiarFormularioPublicacion();
      
      // Mostrar advertencia de 15 minutos
      document.getElementById('modal-advertencia').style.display = 'flex';
      setTimeout(() => {
        document.getElementById('modal-advertencia').style.display = 'none';
      }, 5000);
      
      // Recargar publicaciones
      await cargarPublicaciones();
      
      // Scroll a la primera publicación
      setTimeout(() => {
        const primeraPublicacion = document.querySelector('.proyecto-card');
        if (primeraPublicacion) {
          primeraPublicacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
          primeraPublicacion.style.backgroundColor = '#e8f5e9';
          setTimeout(() => {
            primeraPublicacion.style.backgroundColor = '';
          }, 2000);
        }
      }, 100);
    } else {
      alert(data.message || 'Error al crear la publicación');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
}

function limpiarFormularioPublicacion() {
  document.getElementById('titulo-publicacion').value = '';
  document.getElementById('desc-publicacion').value = '';
}

// ========== CARGAR PUBLICACIONES ==========
async function cargarPublicaciones() {
  console.log('📖 Cargando publicaciones...');
  
  const listaPublicaciones = document.getElementById('proyectos-lista');
  
  if (!listaPublicaciones) {
    console.error('❌ No se encontró el contenedor de publicaciones');
    return;
  }

  listaPublicaciones.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa fa-spinner fa-spin" style="font-size:24px;"></i><br>Cargando publicaciones...</div>';
  
  try {
    const response = await fetch('/api/publicaciones');
    const data = await response.json();

    console.log('📥 Publicaciones recibidas:', data);

    if (data.success && data.publicaciones && data.publicaciones.length > 0) {
      listaPublicaciones.innerHTML = '';

      data.publicaciones.forEach((pub, index) => {
        const esAutor = usuarioActual && usuarioActual.id === pub.ID_usuario;
        const puedeEditarPublicacion = esAutor && pub.puedeEditar;
        const tiempoRestante = pub.minutosRestantes || 0;
        
        // 🔥 CORRECCIÓN: Obtener el rol correcto
        let rolMostrar = 'Usuario'; // Valor por defecto
        
        if (pub.rol_nombre) {
          // Si viene rol_nombre desde el backend, usarlo
          rolMostrar = pub.rol_nombre.charAt(0).toUpperCase() + pub.rol_nombre.slice(1).toLowerCase();
        } else if (pub.rol) {
          // Si viene solo 'rol', usarlo
          rolMostrar = pub.rol.charAt(0).toUpperCase() + pub.rol.slice(1).toLowerCase();
        } else if (pub.ID_rol) {
          // Si solo viene ID_rol, mapear manualmente
          const rolesMap = {
            1: 'Admin',
            2: 'Aprendiz',
            3: 'Egresado'
          };
          rolMostrar = rolesMap[pub.ID_rol] || 'Usuario';
        }
        
        console.log(`📋 Publicación ${pub.ID_publicacion}: Rol = ${rolMostrar}, ID_rol = ${pub.ID_rol}, rol_nombre = ${pub.rol_nombre}`);
        
        // Indicador de tiempo
        let indicadorTiempo = '';
        if (esAutor && tiempoRestante > 0) {
          indicadorTiempo = `<span style="color:#28a745; font-size:12px; margin-left:8px;">⏱️ ${tiempoRestante} min para editar</span>`;
        } else if (esAutor && tiempoRestante === 0) {
          indicadorTiempo = `<span style="color:#dc3545; font-size:12px; margin-left:8px;">⏱️ Tiempo expirado</span>`;
        }
        
        const publicacionHTML = `
          <div class="proyecto-card" 
               data-id="${pub.ID_publicacion}" 
               data-timestamp="${pub.fecha_creacion_timestamp}">
            <div class="proyecto-header">
              <span class="proyecto-titulo">${escapeHtml(pub.titulo)}</span>
              <span class="proyecto-fecha">${formatearFecha(pub.fecha_creacion)}${indicadorTiempo}</span>
              <button class="proyecto-fav" type="button"><i class="fa-regular fa-star"></i></button>
              ${esAutor ? `
                <button class="publicacion-menu-btn" onclick="togglePublicacionMenu(this)">...</button>
                <div class="publicacion-menu" style="display:none;">
                  <div class="popover-arrow"></div>
                  ${puedeEditarPublicacion ? `
                    <button class="menu-btn editar" onclick="editarPublicacion(${pub.ID_publicacion})">Editar</button>
                  ` : `
                    <button disabled style="opacity:0.5; cursor:not-allowed;" title="Tiempo de edición expirado (15 min)">Editar (Expirado)</button>
                  `}
                  <button class="menu-btn eliminar" onclick="eliminarPublicacion(${pub.ID_publicacion})">Eliminar</button>
                </div>
              ` : ''}
            </div>
            <div class="proyecto-autor">
              ${escapeHtml(pub.nombre)} ${escapeHtml(pub.apellido)}
              <span class="proyecto-etiqueta egresado">${rolMostrar}</span>
            </div>
            <div class="proyecto-carrera">${escapeHtml(pub.programa || 'Sin programa')}</div>
            <div class="proyecto-desc">
              ${escapeHtml(pub.contenido)}
            </div>
            <div class="proyecto-footer">
              <span class="proyecto-comentarios">0 Respuestas</span>
              <button class="btn-abrir" type="button">Responder</button>
            </div>
          </div>
        `;
        listaPublicaciones.innerHTML += publicacionHTML;
      });

      console.log('✅ Publicaciones cargadas:', data.publicaciones.length);
      aplicarEventListenersFavoritos();
    } else {
      console.log('🔭 No hay publicaciones');
      listaPublicaciones.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa fa-inbox" style="font-size:48px; opacity:0.3;"></i><br><br>No hay publicaciones aún.<br>¡Sé el primero en publicar!</div>';
    }
  } catch (error) {
    console.error('❌ Error al cargar publicaciones:', error);
    listaPublicaciones.innerHTML = '<div style="text-align:center; padding:40px; color:#dc3545;"><i class="fa fa-exclamation-triangle"></i> Error al cargar las publicaciones. Por favor recarga la página.</div>';
  }
}

// ========== EDITAR PUBLICACIÓN ==========
function configurarModalEdicion() {
  const btnEditarPublicar = document.getElementById('btn-editar-publicar');
  const btnEditarCancelar = document.getElementById('btn-editar-cancelar');
  const modalEditar = document.getElementById('modal-editar');

  if (btnEditarCancelar) {
    btnEditarCancelar.addEventListener('click', function(e) {
      e.preventDefault();
      modalEditar.style.display = 'none';
      publicacionEditandoId = null;
    });
  }

  if (modalEditar) {
    modalEditar.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
        publicacionEditandoId = null;
      }
    });
  }

  if (btnEditarPublicar) {
    btnEditarPublicar.addEventListener('click', async function(e) {
      e.preventDefault();
      await guardarEdicionPublicacion();
    });
  }
}

window.editarPublicacion = async function(id) {
  console.log('✏️ Editando publicación:', id);
  
  // Verificar tiempo límite
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    const timestamp = parseInt(card.getAttribute('data-timestamp'));
    if (!puedeEditar(timestamp)) {
      alert('El tiempo límite para editar esta publicación (15 minutos) ha expirado.');
      return;
    }
  }
  
  publicacionEditandoId = id;
  
  try {
    const response = await fetch(`/api/publicaciones/${id}`);
    const data = await response.json();

    if (data.success) {
      document.getElementById('editar-titulo').value = data.publicacion.titulo;
      document.getElementById('editar-desc').value = data.publicacion.contenido;
      document.getElementById('modal-editar').style.display = 'flex';
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al cargar la publicación');
  }
};

async function guardarEdicionPublicacion() {
  if (!publicacionEditandoId) return;
  
  const titulo = document.getElementById('editar-titulo').value.trim();
  const contenido = document.getElementById('editar-desc').value.trim();

  if (!titulo || !contenido) {
    alert('El título y contenido son obligatorios');
    return;
  }

  try {
    const response = await fetch(`/api/publicaciones/${publicacionEditandoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ titulo, contenido })
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById('modal-editar').style.display = 'none';
      publicacionEditandoId = null;
      await cargarPublicaciones();
      alert('✅ Publicación actualizada exitosamente');
    } else {
      alert(data.message || 'Error al actualizar la publicación');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
}

// ========== ELIMINAR PUBLICACIÓN ==========
window.eliminarPublicacion = async function(id) {
  if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;
  
  try {
    const response = await fetch(`/api/publicaciones/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      await cargarPublicaciones();
      alert('✅ Publicación eliminada exitosamente');
    } else {
      alert(data.message || 'Error al eliminar la publicación');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
};

// ========== FUNCIONES DE TIEMPO ==========
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

function calcularTiempoRestante(fechaCreacionTimestamp) {
  try {
    const ahora = Math.floor(Date.now() / 1000);
    const diferenciaSegundos = ahora - fechaCreacionTimestamp;
    const diferenciaMinutos = diferenciaSegundos / 60;
    return Math.max(0, Math.floor(15 - diferenciaMinutos));
  } catch (error) {
    return 0;
  }
}

function actualizarContadoresTiempo() {
  document.querySelectorAll('.proyecto-card').forEach(card => {
    const timestamp = parseInt(card.getAttribute('data-timestamp'));
    if (!timestamp) return;
    
    const tiempoRestante = calcularTiempoRestante(timestamp);
    const fechaSpan = card.querySelector('.proyecto-fecha');
    
    if (fechaSpan) {
      const fechaBase = fechaSpan.textContent.replace(/⏱️.*$/g, '').trim();
      
      if (tiempoRestante > 0) {
        fechaSpan.innerHTML = `${fechaBase}<span style="color:#28a745; font-size:12px; margin-left:8px;">⏱️ ${tiempoRestante} min para editar</span>`;
      } else {
        fechaSpan.innerHTML = `${fechaBase}<span style="color:#dc3545; font-size:12px; margin-left:8px;">⏱️ Tiempo expirado</span>`;
        
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

// ========== UTILIDADES ==========
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

// ========== MENÚS Y FAVORITOS ==========
window.togglePublicacionMenu = function(btn) {
  const menu = btn.nextElementSibling;
  const isVisible = menu.style.display === 'flex';
  
  // Cerrar otros menús
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

// ========== NOTIFICACIONES ==========
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

// Cerrar menús al hacer clic fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.publicacion-menu-btn')) {
    document.querySelectorAll('.publicacion-menu').forEach(menu => {
      menu.style.display = 'none';
    });
  }
});