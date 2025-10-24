// ========== VARIABLES GLOBALES ==========
let usuarioActual = null;
let token = null;
let publicacionEditandoId = null;


// ========== CONTADOR DE RESPUESTAS ==========
async function obtenerConteoRespuestas(idPublicacion) {
  try {
    const response = await fetch(`/api/publicaciones/${idPublicacion}/respuestas/contar`);
    const data = await response.json();
    return data.success ? data.total : 0;
  } catch (error) {
    console.error('Error al obtener conteo:', error);
    return 0;
  }
}

async function actualizarContador(idPublicacion) {
  const contador = document.getElementById(`contador-${idPublicacion}`);
  if (contador) {
    const total = await obtenerConteoRespuestas(idPublicacion);
    contador.textContent = `${total} Respuesta${total !== 1 ? 's' : ''}`;
  }
}

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

  // Modal de responder
   configurarModalResponder();
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
        
        // Indicador de tiempo (SOLO si tiene tiempo restante)
        let indicadorTiempo = '';
          if (esAutor && tiempoRestante > 0) {
            indicadorTiempo = `<span style="color:#28a745; font-size:12px; margin-left:8px;">⏱️ ${tiempoRestante} min para editar</span>`;
        }
        
        const publicacionHTML = `
          <div class="proyecto-card" 
               data-id="${pub.ID_publicacion}" 
               data-timestamp="${pub.fecha_creacion_timestamp}">
            <div class="proyecto-header">
              <span class="proyecto-titulo">${escapeHtml(pub.titulo)}</span>
              <span class="proyecto-fecha">${formatearFecha(pub.fecha_creacion)}${indicadorTiempo}</span>
              <button class="proyecto-fav" type="button"><i class="fa-regular fa-star"></i></button>
              ${!esAutor ? `
                  <button class="publicacion-menu-btn" onclick="toggleMenuReporte(this, ${pub.ID_publicacion})">⋯</button>
                  <div class="menu-reporte" style="display:none;">
                    <button class="menu-btn reportar" onclick="mostrarModalReportarPublicacion(${pub.ID_publicacion})">
                      Reportar
                    </button>
                  </div>
                ` : ''}
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
              <span class="proyecto-comentarios" id="contador-${pub.ID_publicacion}">...</span>
              <button class="btn-abrir" type="button" onclick="verRespuestas(${pub.ID_publicacion})">Ver Respuestas</button>
              </div>
          </div>
        `;
        listaPublicaciones.innerHTML += publicacionHTML;

        // Cargar todos los contadores después de renderizar
          data.publicaciones.forEach(pub => {
        actualizarContador(pub.ID_publicacion);
      });
        

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

// 🔥 AGREGAR ESTA NUEVA FUNCIÓN AQUÍ
function formatearFechaCompleta(fecha) {
  const date = new Date(fecha);
  
  const dia = date.getDate();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mes = meses[date.getMonth()];
  const año = date.getFullYear();
  
  const horas = date.getHours().toString().padStart(2, '0');
  const minutos = date.getMinutes().toString().padStart(2, '0');
  
  return `${dia} de ${mes} de ${año}, ${horas}:${minutos}`;
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


// ========== MODAL RESPONDER PUBLICACIÓN ==========
window.mostrarResponderModal = function(idPublicacion) {
  console.log('💬 Abriendo modal de respuesta para publicación:', idPublicacion);
  
  // Guardar el ID de la publicación en un atributo del modal
  const modalResponder = document.getElementById('modal-responder');
  if (modalResponder) {
    modalResponder.setAttribute('data-publicacion-id', idPublicacion);
    modalResponder.style.display = 'flex';
    
    // Limpiar el textarea
    const respuestaDesc = document.getElementById('respuesta-desc');
    if (respuestaDesc) {
      respuestaDesc.value = '';
    }
  } else {
    console.error('❌ Modal de responder no encontrado');
  }
};

// Configurar eventos del modal de responder
function configurarModalResponder() {
  const btnResponderPublicar = document.getElementById('btn-responder-publicar');
  const btnResponderCancelar = document.getElementById('btn-responder-cancelar');
  const modalResponder = document.getElementById('modal-responder');

  if (btnResponderCancelar) {
    btnResponderCancelar.addEventListener('click', function(e) {
      e.preventDefault();
      modalResponder.style.display = 'none';
      document.getElementById('respuesta-desc').value = '';
    });
  }

  if (modalResponder) {
    modalResponder.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
        document.getElementById('respuesta-desc').value = '';
      }
    });
  }

  if (btnResponderPublicar) {
    btnResponderPublicar.addEventListener('click', async function(e) {
      e.preventDefault();
      await publicarRespuesta();
    });
  }
}

async function publicarRespuesta() {
  const modalResponder = document.getElementById('modal-responder');
  const idPublicacion = modalResponder.getAttribute('data-publicacion-id');
  const respuesta = document.getElementById('respuesta-desc').value.trim();

  console.log('📤 Intentando publicar respuesta:', { idPublicacion, respuesta });

  if (!respuesta) {
    alert('Por favor ingrese la descripción de su respuesta');
    return;
  }

  if (respuesta.length < 10) {
    alert('La respuesta debe tener al menos 10 caracteres');
    return;
  }

  if (respuesta.length > 1000) {
    alert('La respuesta no puede exceder 1000 caracteres');
    return;
  }

  try {
    //  LLAMADA REAL A LA API
    const response = await fetch(`/api/publicaciones/${idPublicacion}/respuestas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        contenido: respuesta
      })
    });

    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);

    if (data.success) {
      alert('✅ Respuesta publicada exitosamente');
      
      // Cerrar modal y limpiar
      modalResponder.style.display = 'none';
      document.getElementById('respuesta-desc').value = '';
      
      // Recargar publicaciones para actualizar contador
      await cargarPublicaciones();
      
    } else {
      alert(data.message || 'Error al publicar la respuesta');
    }

  } catch (error) {
    console.error('❌ Error al publicar respuesta:', error);
    alert('Error de conexión con el servidor');
  }
}


// ========== MODAL RESPONDER PUBLICACIÓN ==========
window.mostrarResponderModal = function(idPublicacion) {
  console.log('💬 Abriendo modal de respuesta para publicación:', idPublicacion);
  
  const modalResponder = document.getElementById('modal-responder');
  if (modalResponder) {
    modalResponder.setAttribute('data-publicacion-id', idPublicacion);
    modalResponder.style.display = 'flex';
    
    const respuestaDesc = document.getElementById('respuesta-desc');
    if (respuestaDesc) {
      respuestaDesc.value = '';
    }
  }
};

function configurarModalResponder() {
  const btnResponderPublicar = document.getElementById('btn-responder-publicar');
  const btnResponderCancelar = document.getElementById('btn-responder-cancelar');
  const modalResponder = document.getElementById('modal-responder');

  if (btnResponderCancelar) {
    btnResponderCancelar.addEventListener('click', function(e) {
      e.preventDefault();
      modalResponder.style.display = 'none';
      document.getElementById('respuesta-desc').value = '';
    });
  }

  if (modalResponder) {
    modalResponder.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
        document.getElementById('respuesta-desc').value = '';
      }
    });
  }

  if (btnResponderPublicar) {
    btnResponderPublicar.addEventListener('click', async function(e) {
      e.preventDefault();
      await publicarRespuesta();
    });
  }
}

async function publicarRespuesta() {
  const modalResponder = document.getElementById('modal-responder');
  const idPublicacion = modalResponder.getAttribute('data-publicacion-id');
  const respuesta = document.getElementById('respuesta-desc').value.trim();

  if (!respuesta) {
    alert('Por favor ingrese la descripción de su respuesta');
    return;
  }

  if (respuesta.length < 10) {
    alert('La respuesta debe tener al menos 10 caracteres');
    return;
  }

  try {
    // TODO: Implementar llamada a API de comentarios
    console.log('✅ Respuesta lista para enviar:', {
      ID_publicacion: idPublicacion,
      contenido: respuesta
    });

    alert('✅ Respuesta publicada exitosamente');
    modalResponder.style.display = 'none';
    document.getElementById('respuesta-desc').value = '';
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
}

// ============================================
// SISTEMA COMPLETO DE RESPUESTAS
// ============================================

let respuestaEditandoId = null;

// 🔥 NUEVA FUNCIÓN: Ver respuestas de una publicación
window.verRespuestas = async function(idPublicacion) {
  console.log('👀 Cargando respuestas de publicación:', idPublicacion);
  
  try {
    const response = await fetch(`/api/publicaciones/${idPublicacion}/respuestas`);
    const data = await response.json();
    
    if (data.success) {
      mostrarModalRespuestas(idPublicacion, data.respuestas);
    } else {
      alert('Error al cargar las respuestas');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
};

// 🔥 FUNCIÓN: Mostrar modal con todas las respuestas
function mostrarModalRespuestas(idPublicacion, respuestas) {
  // Crear modal dinámico
  const modalHTML = `
    <div id="modal-ver-respuestas" class="modal-publicacion" style="display:flex;">
      <div class="modal-content" style="max-width:700px; max-height:80vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2 style="margin:0;">Respuestas (${respuestas.length})</h2>
          <button onclick="cerrarModalRespuestas()" style="background:none; border:none; font-size:1.5em; cursor:pointer; color:#888;">×</button>
        </div>
        
        <div id="lista-respuestas">
          ${respuestas.length === 0 ? 
            '<div class="comentario-vacio">No hay respuestas aún. ¡Sé el primero en responder!</div>' 
            : 
            respuestas.map(r => crearHTMLRespuesta(r)).join('')
          }
        </div>
        
        <div style="margin-top:20px; text-align:center;">
          <button class="btn-modal" onclick="cerrarModalRespuestas(); mostrarResponderModal(${idPublicacion});">
            Nueva Respuesta
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Eliminar modal anterior si existe
  const modalAnterior = document.getElementById('modal-ver-respuestas');
  if (modalAnterior) modalAnterior.remove();
  
  // Agregar al body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Cerrar al hacer clic fuera
  document.getElementById('modal-ver-respuestas').addEventListener('click', function(e) {
    if (e.target === this) {
      cerrarModalRespuestas();
    }
  });
}

// 🔥 FUNCIÓN CORREGIDA: Crear HTML de cada respuesta
function crearHTMLRespuesta(respuesta) {
  const esAutorRespuesta = usuarioActual && usuarioActual.id === respuesta.ID_usuario;
  const puedeEditar = esAutorRespuesta && respuesta.puedeEditar;
  const tiempoRestante = respuesta.minutosRestantes || 0;
  
  // Obtener rol
  let rolMostrar = 'Usuario';
  if (respuesta.rol_nombre) {
    rolMostrar = respuesta.rol_nombre.charAt(0).toUpperCase() + respuesta.rol_nombre.slice(1).toLowerCase();
  } else if (respuesta.rol) {
    rolMostrar = respuesta.rol.charAt(0).toUpperCase() + respuesta.rol.slice(1).toLowerCase();
  }
  
  // 🔥 CORRECCIÓN: Convertir timestamp a fecha correcta
  let fechaMostrar = 'Fecha no disponible';
  
  if (respuesta.fecha_creacion_js) {
    // Ya viene en milisegundos desde el backend
    fechaMostrar = formatearFechaCompleta(new Date(respuesta.fecha_creacion_js));
    console.log('✅ Fecha convertida:', fechaMostrar, 'desde timestamp:', respuesta.fecha_creacion_js);
  } else if (respuesta.fecha_creacion) {
    // Intentar parsear la fecha directamente
    fechaMostrar = formatearFechaCompleta(new Date(respuesta.fecha_creacion));
    console.log('⚠️ Usando fecha_creacion directamente:', fechaMostrar);
  } else {
    console.error('❌ No hay fecha disponible para respuesta:', respuesta.ID_respuesta);
  }
  
  // 🔥 INDICADOR DE TIEMPO: Solo mostrar si tiene tiempo restante
  let indicadorTiempo = '';
  if (esAutorRespuesta && tiempoRestante > 0) {
    indicadorTiempo = `<span style="color:#28a745; font-size:11px; margin-left:8px;">⏱️ ${tiempoRestante} min para editar</span>`;
  }

  
  return `
    <div class="comentario-card" style="margin-bottom:14px;">
      <div class="comentario-header">
        <span class="comentario-autor">${escapeHtml(respuesta.nombre)} ${escapeHtml(respuesta.apellido)}</span>
        <span class="comentario-etiqueta aprendiz">${rolMostrar}</span>
        <span class="comentario-fecha">${fechaMostrar}${indicadorTiempo}</span>
        
        ${esAutorRespuesta ? `
          <button class="comentario-menu-btn" onclick="toggleComentarioMenu(this)">...</button>
          <div class="comentario-menu" style="display:none;">
            ${puedeEditar ? `
              <button class="menu-btn editar" onclick="editarRespuesta(${respuesta.ID_respuesta})">Editar</button>
            ` : `
              <button disabled style="opacity:0.5; cursor:not-allowed;" title="Tiempo de edición expirado">Editar (Expirado)</button>
            `}
            <button class="menu-btn eliminar" onclick="eliminarRespuesta(${respuesta.ID_respuesta}, ${respuesta.ID_publicacion})">Eliminar</button>
          </div>
        ` : ''}
      </div>
      <div class="comentario-texto" id="respuesta-texto-${respuesta.ID_respuesta}">
        ${escapeHtml(respuesta.contenido)}
      </div>
    </div>
  `;
}

// 🔥 FUNCIÓN: Cerrar modal de respuestas
window.cerrarModalRespuestas = function() {
  const modal = document.getElementById('modal-ver-respuestas');
  if (modal) modal.remove();
};

// 🔥 FUNCIÓN: Toggle menú de respuesta
window.toggleComentarioMenu = function(btn) {
  const menu = btn.nextElementSibling;
  const isVisible = menu.style.display === 'flex';
  
  // Cerrar otros menús
  document.querySelectorAll('.comentario-menu').forEach(m => {
    if (m !== menu) m.style.display = 'none';
  });
  
  menu.style.display = isVisible ? 'none' : 'flex';
};

// 🔥 FUNCIÓN: Editar respuesta
window.editarRespuesta = async function(idRespuesta) {
  console.log('✏️ Editando respuesta:', idRespuesta);
  
  respuestaEditandoId = idRespuesta;
  
  // Obtener el texto actual
  const textoActual = document.getElementById(`respuesta-texto-${idRespuesta}`).textContent.trim();
  
  // Crear modal de edición
  const modalHTML = `
    <div id="modal-editar-respuesta" class="modal-publicacion" style="display:flex;">
      <div class="modal-content">
        <h2>Editar Respuesta</h2>
        <textarea id="editar-respuesta-desc" placeholder="Edita tu respuesta..." style="width:100%; min-height:100px; border:1.5px solid #3ec9a7; border-radius:12px; padding:10px; font-size:1rem; resize:vertical;">${textoActual}</textarea>
        <div class="modal-btns">
          <button id="btn-guardar-respuesta" class="btn-modal">Guardar</button>
          <button id="btn-cancelar-editar-respuesta" class="btn-modal cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  // Eliminar modal anterior
  const modalAnterior = document.getElementById('modal-editar-respuesta');
  if (modalAnterior) modalAnterior.remove();
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Event listeners
  document.getElementById('btn-guardar-respuesta').addEventListener('click', guardarEdicionRespuesta);
  document.getElementById('btn-cancelar-editar-respuesta').addEventListener('click', function() {
    document.getElementById('modal-editar-respuesta').remove();
    respuestaEditandoId = null;
  });
  
  // Cerrar al hacer clic fuera
  document.getElementById('modal-editar-respuesta').addEventListener('click', function(e) {
    if (e.target === this) {
      this.remove();
      respuestaEditandoId = null;
    }
  });
};

// 🔥 FUNCIÓN: Guardar edición de respuesta
async function guardarEdicionRespuesta() {
  if (!respuestaEditandoId) return;
  
  const contenido = document.getElementById('editar-respuesta-desc').value.trim();
  
  if (!contenido || contenido.length < 10) {
    alert('La respuesta debe tener al menos 10 caracteres');
    return;
  }
  
  if (contenido.length > 1000) {
    alert('La respuesta no puede exceder 1000 caracteres');
    return;
  }
  
  try {
    const response = await fetch(`/api/respuestas/${respuestaEditandoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ contenido })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Respuesta actualizada exitosamente');
      document.getElementById('modal-editar-respuesta').remove();
      respuestaEditandoId = null;
      
      // Recargar el modal de respuestas
      const modalVerRespuestas = document.getElementById('modal-ver-respuestas');
      if (modalVerRespuestas) {
        const idPublicacion = modalVerRespuestas.querySelector('.btn-modal').getAttribute('onclick').match(/\d+/)[0];
        cerrarModalRespuestas();
        verRespuestas(idPublicacion);
      }
    } else {
      alert(data.message || 'Error al actualizar la respuesta');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
}

// 🔥 FUNCIÓN: Eliminar respuesta
window.eliminarRespuesta = async function(idRespuesta, idPublicacion) {
  if (!confirm('¿Estás seguro de eliminar esta respuesta?')) return;
  
  try {
    const response = await fetch(`/api/respuestas/${idRespuesta}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Respuesta eliminada exitosamente');

      await actualizarContador(idPublicacion);
      
      // Recargar el modal de respuestas
      const modalVerRespuestas = document.getElementById('modal-ver-respuestas');
      if (modalVerRespuestas) {
        const idPublicacion = modalVerRespuestas.querySelector('.btn-modal').getAttribute('onclick').match(/\d+/)[0];
        cerrarModalRespuestas();
        verRespuestas(idPublicacion);
      }
    } else {
      alert(data.message || 'Error al eliminar la respuesta');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
};

// 🔥 MODIFICAR: Función publicarRespuesta para recargar respuestas después
async function publicarRespuesta() {
  const modalResponder = document.getElementById('modal-responder');
  const idPublicacion = modalResponder.getAttribute('data-publicacion-id');
  const respuesta = document.getElementById('respuesta-desc').value.trim();

  if (!respuesta) {
    alert('Por favor ingrese la descripción de su respuesta');
    return;
  }

  if (respuesta.length < 10) {
    alert('La respuesta debe tener al menos 10 caracteres');
    return;
  }

  if (respuesta.length > 1000) {
    alert('La respuesta no puede exceder 1000 caracteres');
    return;
  }

  try {
    const response = await fetch(`/api/publicaciones/${idPublicacion}/respuestas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        contenido: respuesta
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Respuesta publicada exitosamente');
      
      // Cerrar modal y limpiar
      modalResponder.style.display = 'none';
      document.getElementById('respuesta-desc').value = '';

      await actualizarContador(idPublicacion);
      
      // 🔥 IMPORTANTE: Esperar 500ms antes de actualizar el contador
      // Esto asegura que la BD tenga tiempo de guardar la respuesta
      setTimeout(async () => {
        await cargarContadorRespuestas(idPublicacion);
        console.log('🔄 Contador actualizado');
      }, 500);
      
      // Si el modal de respuestas está abierto, recargarlo también
      setTimeout(() => {
        if (document.getElementById('modal-ver-respuestas')) {
          verRespuestas(idPublicacion);
        }
      }, 600);
      
      alert('✅ Respuesta publicada exitosamente');
    } else {
      alert(data.message || 'Error al publicar la respuesta');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
}


// ============================================
// SISTEMA DE REPORTES DE PUBLICACIONES
// ============================================

let publicacionReportandoId = null;

/**
 * Mostrar modal para reportar publicación
 */
window.mostrarModalReportarPublicacion = function(idPublicacion) {
  console.log('🚨 Abriendo modal de reporte para publicación:', idPublicacion);
  
  publicacionReportandoId = idPublicacion;
  
  // Limpiar formulario
  document.getElementById('motivo-reporte-publicacion').value = '';
  document.getElementById('descripcion-reporte-publicacion').value = '';
  
  // Mostrar modal
  document.getElementById('modal-reportar-publicacion').style.display = 'flex';
};

/**
 * Cerrar modal de reporte
 */
function cerrarModalReportarPublicacion() {
  document.getElementById('modal-reportar-publicacion').style.display = 'none';
  publicacionReportandoId = null;
}

/**
 * Enviar reporte de publicación
 */
async function enviarReportePublicacion() {
  if (!publicacionReportandoId) return;
  
  const motivo = document.getElementById('motivo-reporte-publicacion').value;
  const descripcion = document.getElementById('descripcion-reporte-publicacion').value.trim();
  
  if (!motivo) {
    alert('Por favor seleccione un motivo para el reporte');
    return;
  }
  
  try {
    const response = await fetch(`/api/publicaciones/${publicacionReportandoId}/reportar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        motivo: motivo,
        descripcion: descripcion || null
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ ' + data.message);
      cerrarModalReportarPublicacion();
    } else {
      alert(data.message || 'Error al enviar el reporte');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor');
  }
}

// Configurar eventos del modal de reporte
document.addEventListener('DOMContentLoaded', function() {
  const btnEnviarReporte = document.getElementById('btn-enviar-reporte-publicacion');
  const btnCancelarReporte = document.getElementById('btn-cancelar-reporte-publicacion');
  const modalReportar = document.getElementById('modal-reportar-publicacion');
  
  if (btnEnviarReporte) {
    btnEnviarReporte.addEventListener('click', enviarReportePublicacion);
  }
  
  if (btnCancelarReporte) {
    btnCancelarReporte.addEventListener('click', cerrarModalReportarPublicacion);
  }
  
  if (modalReportar) {
    modalReportar.addEventListener('click', function(e) {
      if (e.target === this) {
        cerrarModalReportarPublicacion();
      }
    });
  }
});


// ========== MENÚ DE REPORTE ==========
window.toggleMenuReporte = function(btn, idPublicacion) {
  const menu = btn.nextElementSibling;
  const isVisible = menu.style.display === 'flex';
  
  // Cerrar todos los menús de reporte
  document.querySelectorAll('.menu-reporte').forEach(m => {
    if (m !== menu) m.style.display = 'none';
  });
  
  menu.style.display = isVisible ? 'none' : 'flex';
  
  // Cerrar al hacer clic fuera
  if (!isVisible) {
    setTimeout(() => {
      document.addEventListener('click', function cerrarMenu(e) {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
          document.removeEventListener('click', cerrarMenu);
        }
      });
    }, 10);
  }
};