// ==================== VARIABLES GLOBALES ====================
let usuarioActual = null;
let token = null;
let menuComentarioAbierto = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Iniciando página de detalles del proyecto...');
  
  // Verificar autenticación
  verificarAutenticacion();
  
  // Configurar event listeners
  configurarEventListeners();
  
  // Cargar detalles del proyecto
  cargarDetallesProyecto();
  
  // Configurar contador de caracteres
  configurarContadorCaracteres();
});

// ==================== AUTENTICACIÓN ====================
function verificarAutenticacion() {
  token = localStorage.getItem('token');
  const usuarioStr = localStorage.getItem('usuario');
  
  if (!token || !usuarioStr) {
    console.log('❌ No hay sesión activa');
    const btnPublicar = document.getElementById('btn-publicar-comentario');
    if (btnPublicar) {
      btnPublicar.disabled = true;
      btnPublicar.textContent = 'Inicia sesión para comentar';
    }
    return;
  }
  
  try {
    usuarioActual = JSON.parse(usuarioStr);
    console.log('✅ Usuario autenticado:', usuarioActual);
    actualizarHeaderUsuario();
  } catch (error) {
    console.error('Error al parsear usuario:', error);
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
    const inicial = (usuarioActual.nombre_corto || 
                    usuarioActual.nombre?.charAt(0) || 
                    'U').toUpperCase();
    userAvatarElement.textContent = inicial;
  }
}

// ==================== CONFIGURAR EVENT LISTENERS ====================
function configurarEventListeners() {
  // Menú de perfil
  configurarMenuPerfil();
  
  // Notificaciones
  configurarNotificaciones();
  
  // Publicar comentario
  const btnPublicarComentario = document.getElementById('btn-publicar-comentario');
  if (btnPublicarComentario) {
    btnPublicarComentario.addEventListener('click', publicarComentario);
  }
  
  // Modales
  configurarModales();
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', cerrarSesion);
  }
}

// ==================== CONFIGURAR MENÚ DE PERFIL ====================
function configurarMenuPerfil() {
  const perfilBtn = document.getElementById('perfil-btn');
  const popoverMenu = document.getElementById('popover-menu');
  
  if (!perfilBtn || !popoverMenu) {
    console.warn('⚠️ No se encontró el botón de perfil o el menú');
    return;
  }
  
  perfilBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isVisible = popoverMenu.style.display === 'block';
    
    // Cerrar notificaciones si están abiertas
    const notifPopover = document.getElementById('notificaciones-popover');
    if (notifPopover) {
      notifPopover.style.display = 'none';
    }
    
    // Toggle menú
    popoverMenu.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      const rect = perfilBtn.getBoundingClientRect();
      popoverMenu.style.position = 'fixed';
      popoverMenu.style.top = (rect.bottom + 10) + 'px';
      popoverMenu.style.left = (rect.left + rect.width/2 - 160) + 'px';
      popoverMenu.style.zIndex = '1000';
    }
  });
  
  // Configurar items del menú
  const menuItems = document.querySelectorAll('.popover-list li');
  menuItems.forEach((li, idx) => {
    li.addEventListener('click', () => {
      console.log('📍 Click en opción del menú:', idx);
      
      switch(idx) {
        case 0: // Perfil
          window.location.href = '/perfil';
          break;
        case 1: // Configuración
          window.location.href = '/configuracion';
          break;
        case 2: // Favoritos
          window.location.href = '/favoritos';
          break;
        case 3: // Ayuda
          window.location.href = '/ayuda';
          break;
      }
      
      popoverMenu.style.display = 'none';
    });
  });
  
  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (popoverMenu && !popoverMenu.contains(e.target) && !perfilBtn.contains(e.target)) {
      popoverMenu.style.display = 'none';
    }
  });
}

// ==================== CONFIGURAR NOTIFICACIONES ====================
function configurarNotificaciones() {
  const notiBtn = document.getElementById('notificaciones-btn');
  const notiPopover = document.getElementById('notificaciones-popover');
  
  if (!notiBtn || !notiPopover) return;
  
  notiBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isVisible = notiPopover.style.display === 'block';
    
    // Cerrar menú de perfil si está abierto
    const popoverMenu = document.getElementById('popover-menu');
    if (popoverMenu) {
      popoverMenu.style.display = 'none';
    }
    
    notiPopover.style.display = isVisible ? 'none' : 'block';
  });
  
  document.addEventListener('click', function(e) {
    if (notiPopover && !notiPopover.contains(e.target) && e.target !== notiBtn) {
      notiPopover.style.display = 'none';
    }
  });
}

// ==================== CERRAR SESIÓN ====================
function cerrarSesion() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }
}

// ==================== CONFIGURAR MODALES ====================
function configurarModales() {
  // Modal editar comentario
  const btnCancelarEdicion = document.getElementById('btn-editar-comentario-cancelar');
  const modalEditar = document.getElementById('modal-editar-comentario');
  
  if (btnCancelarEdicion && modalEditar) {
    btnCancelarEdicion.addEventListener('click', function() {
      modalEditar.style.display = 'none';
    });
    
    modalEditar.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  }
  
  // Formulario editar comentario
  const formEditar = document.getElementById('form-editar-comentario');
  if (formEditar) {
    formEditar.addEventListener('submit', guardarEdicionComentario);
  }
  
  // Modal reportar comentario
  const btnCancelarReporte = document.getElementById('btn-cancelar-reporte');
  const modalReportar = document.getElementById('modal-reportar-comentario');
  
  if (btnCancelarReporte && modalReportar) {
    btnCancelarReporte.addEventListener('click', function() {
      modalReportar.style.display = 'none';
    });
    
    modalReportar.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  }
}

// ==================== CONTADOR DE CARACTERES ====================
function configurarContadorCaracteres() {
  const textoComentario = document.getElementById('texto-comentario');
  const contador = document.getElementById('contador');
  
  if (textoComentario && contador) {
    textoComentario.addEventListener('input', function() {
      const texto = this.value;
      contador.textContent = texto.length;
      
      if (texto.length > 100) {
        contador.style.color = '#e53e3e';
        contador.style.fontWeight = 'bold';
      } else {
        contador.style.color = '#666';
        contador.style.fontWeight = 'normal';
      }
    });
  }
  
  // Contador para edición
  const editarTexto = document.getElementById('editar-comentario-texto');
  const editContador = document.getElementById('edit-contador');
  
  if (editarTexto && editContador) {
    editarTexto.addEventListener('input', function() {
      const texto = this.value;
      editContador.textContent = texto.length;
      
      if (texto.length > 100) {
        editContador.style.color = '#e53e3e';
        editContador.style.fontWeight = 'bold';
      } else {
        editContador.style.color = '#666';
        editContador.style.fontWeight = 'normal';
      }
    });
  }
}

// ==================== CARGAR DETALLES DEL PROYECTO ====================
async function cargarDetallesProyecto() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');
    
    if (!proyectoId) {
      console.error('No se proporcionó ID de proyecto');
      mostrarProyectoEjemplo();
      return;
    }

    console.log('📖 Cargando detalles del proyecto:', proyectoId);
    
    const response = await fetch(`/api/proyectos/${proyectoId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📥 Datos del proyecto:', data);
    
    if (data.success && data.proyecto) {
      mostrarDetallesProyecto(data.proyecto);
    } else {
      throw new Error(data.message || 'Error al cargar proyecto');
    }
    
  } catch (error) {
    console.error('❌ Error al cargar detalles:', error);
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

  console.log('📷 Imágenes a mostrar:', imagenes);

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

window.cambiarImagenPrincipal = function(src) {
  document.getElementById('imagen-principal').src = src;
};

// ==================== COMENTARIOS ====================
async function cargarComentariosProyecto(proyecto) {
  try {
    const proyectoId = proyecto.ID_proyecto;
    const user_id = usuarioActual ? (usuarioActual.ID_usuario || usuarioActual.id) : 0;
    
    console.log('📖 Cargando comentarios:', { proyectoId, user_id });
    
    const response = await fetch(`/api/proyectos/${proyectoId}/comentarios?user_id=${user_id}`);
    const data = await response.json();
    
    const listaComentarios = document.getElementById('lista-comentarios');
    
    if (data.success && data.comentarios && data.comentarios.length > 0) {
      listaComentarios.innerHTML = data.comentarios.map(comentario => `
        <div class="comentario-item" id="comentario-${comentario.ID_comentario}">
          <div class="comentario-header">
            <div class="comentario-info">
              <span class="comentario-autor">${comentario.nombre || 'Usuario'} ${comentario.apellido || ''}</span>
              <span class="comentario-fecha">${formatearFecha(comentario.fecha_creacion)}</span>
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
            ` : ''}
          </div>
          
          <div class="comentario-contenido" id="texto-comentario-${comentario.ID_comentario}">
            ${comentario.contenido}
          </div>
        </div>
      `).join('');
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
    console.error('❌ Error al cargar comentarios:', error);
    document.getElementById('lista-comentarios').innerHTML = `
      <div class="error-comentarios">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar comentarios</p>
      </div>
    `;
  }
}

// ==================== PUBLICAR COMENTARIO ====================
async function publicarComentario() {
  const texto = document.getElementById('texto-comentario').value.trim();
  
  if (!usuarioActual || !token) {
    alert('❌ Debes iniciar sesión para comentar');
    window.location.href = '/login';
    return;
  }
  
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
    console.log('📤 Enviando comentario...', { 
      proyectoId, 
      texto,
      ID_usuario: usuarioActual.ID_usuario || usuarioActual.id
    });
    
    const response = await fetch(`/api/proyectos/${proyectoId}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        contenido: texto,
        user_id: usuarioActual.ID_usuario || usuarioActual.id
      })
    });

    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);
    
    if (data.success) {
      document.getElementById('texto-comentario').value = '';
      document.getElementById('contador').textContent = '0';
      document.getElementById('contador').style.color = '#666';
      alert('✅ Comentario publicado exitosamente');
      cargarDetallesProyecto();
    } else {
      alert('❌ Error al publicar comentario: ' + data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error de conexión al publicar comentario');
  }
}

// ==================== MENÚ DE COMENTARIOS ====================
window.toggleComentarioMenu = function(comentarioId, event) {
  event.stopPropagation();
  const menu = document.getElementById(`menu-comentario-${comentarioId}`);
  
  if (menuComentarioAbierto && menuComentarioAbierto !== menu) {
    menuComentarioAbierto.classList.remove('mostrar');
  }
  
  menu.classList.toggle('mostrar');
  menuComentarioAbierto = menu.classList.contains('mostrar') ? menu : null;
};

document.addEventListener('click', function(e) {
  if (menuComentarioAbierto && !e.target.closest('.comentario-acciones')) {
    menuComentarioAbierto.classList.remove('mostrar');
    menuComentarioAbierto = null;
  }
});

// ==================== EDITAR COMENTARIO ====================
window.editarComentario = function(comentarioId) {
  if (!usuarioActual) {
    alert('❌ Debes iniciar sesión para editar comentarios');
    return;
  }
  
  const comentarioTexto = document.getElementById(`texto-comentario-${comentarioId}`).innerText;
  
  document.getElementById('edit_comentario_id').value = comentarioId;
  document.getElementById('editar-comentario-texto').value = comentarioTexto;
  document.getElementById('edit-contador').textContent = comentarioTexto.length;
  
  document.getElementById('modal-editar-comentario').style.display = 'flex';
  
  if (menuComentarioAbierto) {
    menuComentarioAbierto.classList.remove('mostrar');
    menuComentarioAbierto = null;
  }
};

async function guardarEdicionComentario(e) {
  e.preventDefault();
  
  if (!usuarioActual) {
    alert('❌ Debes iniciar sesión');
    return;
  }
  
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
    const user_id = usuarioActual.ID_usuario || usuarioActual.id;
    
    const response = await fetch(`/api/comentarios/${comentarioId}/editar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        contenido: nuevoTexto,
        user_id: user_id
      })
    });
    
    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);
    
    if (data.success) {
      alert('✅ Comentario actualizado exitosamente!');
      document.getElementById('modal-editar-comentario').style.display = 'none';
      cargarDetallesProyecto();
    } else {
      throw new Error(data.message || 'Error al actualizar comentario');
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar comentario:', error);
    alert('❌ Error al actualizar comentario: ' + error.message);
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// ==================== ELIMINAR COMENTARIO ====================
window.eliminarComentario = async function(comentarioId) {
  if (!usuarioActual) {
    alert('❌ Debes iniciar sesión');
    return;
  }
  
  if (!confirm('¿Estás seguro de que quieres eliminar este comentario?\nEsta acción no se puede deshacer.')) {
    return;
  }

  try {
    const user_id = usuarioActual.ID_usuario || usuarioActual.id;
    
    const response = await fetch(`/api/comentarios/${comentarioId}/eliminar`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: user_id })
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Comentario eliminado exitosamente');
      cargarDetallesProyecto();
    } else {
      alert('❌ Error: ' + data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error al eliminar comentario');
  }
  
  if (menuComentarioAbierto) {
    menuComentarioAbierto.classList.remove('mostrar');
    menuComentarioAbierto = null;
  }
};

// ==================== UTILIDADES ====================
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

console.log('✅ Script de detalles-proyectos.js cargado correctamente');