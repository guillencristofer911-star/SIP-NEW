let usuarioActual = null;
let token = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Iniciando página de detalles del proyecto...');
  
  // 🔥 VERIFICAR AUTENTICACIÓN
  verificarAutenticacion();
  
  // Cargar detalles del proyecto
  cargarDetallesProyecto();
});

// 🔥 FUNCIÓN NUEVA: Verificar autenticación
function verificarAutenticacion() {
  token = localStorage.getItem('token');
  const usuarioStr = localStorage.getItem('usuario');
  
  if (!token || !usuarioStr) {
    console.log('❌ No hay sesión activa');
    // Deshabilitar formulario de comentarios
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

// 🔥 FUNCIÓN NUEVA: Actualizar header con info del usuario
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

// ============================================
// 🔥 REEMPLAZAR LA FUNCIÓN: Publicar nuevo comentario
// ============================================
document.getElementById('btn-publicar-comentario').addEventListener('click', async function() {
  const texto = document.getElementById('texto-comentario').value.trim();
  
  // Validar que haya sesión activa
  if (!usuarioActual || !token) {
    alert('❌ Debes iniciar sesión para comentar');
    window.location.href = '/login';
    return;
  }
  
  // VALIDAR LONGITUD MÁXIMA (100 caracteres)
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
      user_id: usuarioActual.id || usuarioActual.ID_usuario 
    });
    
    // 🔥 USAR EL ID DEL USUARIO AUTENTICADO
    const response = await fetch(`/api/proyectos/${proyectoId}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔥 AGREGAR TOKEN
      },
      body: JSON.stringify({
        contenido: texto,
        user_id: usuarioActual.id || usuarioActual.ID_usuario // 🔥 ID REAL DEL USUARIO
      })
    });

    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);
    
    if (data.success) {
      document.getElementById('texto-comentario').value = '';
      document.getElementById('contador').textContent = '0';
      document.getElementById('contador').style.color = '#666';
      alert('✅ Comentario publicado exitosamente');
      cargarDetallesProyecto(); // Recargar para mostrar el nuevo comentario
    } else {
      alert('❌ Error al publicar comentario: ' + data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error de conexión al publicar comentario');
  }
});

// ============================================
// 🔥 ACTUALIZAR: Función cargar comentarios
// ============================================
async function cargarComentariosProyecto(proyecto) {
  try {
    const proyectoId = proyecto.ID_proyecto;
    
    // 🔥 USAR ID DEL USUARIO AUTENTICADO (o 0 si no hay sesión)
    const user_id = usuarioActual ? (usuarioActual.id || usuarioActual.ID_usuario) : 0;
    
    console.log('📖 Cargando comentarios con user_id:', user_id);
    
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
            
            <!-- Menú de 3 puntos solo si es el autor -->
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

// ============================================
// 🔥 ACTUALIZAR: Función editar comentario
// ============================================
function editarComentario(comentarioId) {
  // Verificar autenticación
  if (!usuarioActual) {
    alert('❌ Debes iniciar sesión para editar comentarios');
    return;
  }
  
  const comentarioTexto = document.getElementById(`texto-comentario-${comentarioId}`).innerText;
  
  document.getElementById('edit_comentario_id').value = comentarioId;
  document.getElementById('editar-comentario-texto').value = comentarioTexto;
  document.getElementById('edit-contador').textContent = comentarioTexto.length;
  
  // Mostrar modal de edición
  document.getElementById('modal-editar-comentario').style.display = 'flex';
  
  // Cerrar menú
  if (menuComentarioAbierto) {
    menuComentarioAbierto.classList.remove('mostrar');
    menuComentarioAbierto = null;
  }
}

// ============================================
// 🔥 ACTUALIZAR: Guardar edición de comentario
// ============================================
document.getElementById('form-editar-comentario').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Verificar autenticación
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

  // Mostrar loading
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
  submitBtn.disabled = true;
  
  try {
    // 🔥 USAR ID DEL USUARIO AUTENTICADO
    const user_id = usuarioActual.id || usuarioActual.ID_usuario;
    
    const response = await fetch(`/api/comentarios/${comentarioId}/editar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔥 AGREGAR TOKEN
      },
      body: JSON.stringify({ 
        contenido: nuevoTexto,
        user_id: user_id // 🔥 ID REAL
      })
    });
    
    const data = await response.json();
    console.log('📥 Respuesta del servidor:', data);
    
    if (data.success) {
      alert('✅ Comentario actualizado exitosamente!');
      
      // Cerrar modal
      document.getElementById('modal-editar-comentario').style.display = 'none';
      
      // Recargar comentarios
      cargarDetallesProyecto();
    } else {
      throw new Error(data.message || 'Error al actualizar comentario');
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar comentario:', error);
    alert('❌ Error al actualizar comentario: ' + error.message);
  } finally {
    // Restaurar botón
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// ============================================
// 🔥 ACTUALIZAR: Función eliminar comentario
// ============================================
async function eliminarComentario(comentarioId) {
  // Verificar autenticación
  if (!usuarioActual) {
    alert('❌ Debes iniciar sesión');
    return;
  }
  
  if (!confirm('¿Estás seguro de que quieres eliminar este comentario?\nEsta acción no se puede deshacer.')) {
    return;
  }

  try {
    // 🔥 USAR ID DEL USUARIO AUTENTICADO
    const user_id = usuarioActual.id || usuarioActual.ID_usuario;
    
    const response = await fetch(`/api/comentarios/${comentarioId}/eliminar`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔥 AGREGAR TOKEN
      },
      body: JSON.stringify({ user_id: user_id }) // 🔥 ID REAL
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Comentario eliminado exitosamente');
      // Recargar los comentarios
      cargarDetallesProyecto();
    } else {
      alert('❌ Error: ' + data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error al eliminar comentario');
  }
  
  // Cerrar menú
  if (menuComentarioAbierto) {
    menuComentarioAbierto.classList.remove('mostrar');
    menuComentarioAbierto = null;
  }
}

// ============================================
// 🔥 CONFIGURAR MENÚ POPOVER Y LOGOUT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  // Configurar menú de perfil
  configurarMenuPerfil();
  
  // Configurar logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
      }
    });
  }
});

function configurarMenuPerfil() {
  const perfilBtn = document.getElementById('perfil-btn');
  const popoverMenu = document.getElementById('popover-menu');
  
  if (perfilBtn && popoverMenu) {
    perfilBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isVisible = popoverMenu.style.display === 'block';
      popoverMenu.style.display = isVisible ? 'none' : 'block';
    });
  }
  
  document.addEventListener('click', function(e) {
    if (popoverMenu && !popoverMenu.contains(e.target) && e.target !== perfilBtn) {
      popoverMenu.style.display = 'none';
    }
  });
  
  // Configurar items del menú
  document.querySelectorAll('.popover-list li').forEach((li, idx) => {
    li.addEventListener('click', () => {
      switch(idx) {
        case 0: 
          window.location.href = '/perfil';
          break;
        case 1: 
          window.location.href = '/configuracion';
          break;
        case 2: 
          window.location.href = '/favoritos';
          break;
        case 3: 
          window.location.href = '/ayuda';
          break;
      }
      popoverMenu.style.display = 'none';
    });
  });
}

console.log('✅ Sistema de comentarios con autenticación cargado correctamente');


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

      // Manejar diferentes formatos de imágenes
      let imagenes = [];

      // Caso 1: Array de imágenes directo
      if (proyecto.imagenes && Array.isArray(proyecto.imagenes)) {
        imagenes = proyecto.imagenes;
      }
      // Caso 2: Imágenes desde relación imagen_proyecto
      else if (proyecto.imagen_proyecto && Array.isArray(proyecto.imagen_proyecto)) {
        imagenes = proyecto.imagen_proyecto.map(img => img.ruta_imagen || img.url);
      }
      // Caso 3: Imagen individual
      else if (proyecto.ruta_imagen || proyecto.imagen_principal) {
        imagenes = [proyecto.ruta_imagen || proyecto.imagen_principal];
      }

      console.log('Imágenes a mostrar:', imagenes);

      if (imagenes.length > 0) {
        // Usar primera imagen como principal
        const primeraImagen = imagenes[0];
        imagenPrincipal.src = primeraImagen.startsWith('/') ? primeraImagen : `/uploads/${primeraImagen}`;
        imagenPrincipal.alt = proyecto.nombre || 'Imagen del proyecto';

        // Crear galería con todas las imágenes
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
        // Si no hay imágenes, usar placeholder
        imagenPrincipal.src = '/img/placeholder-proyecto.png';
        imagenPrincipal.alt = 'Imagen no disponible';
        
        // Crear 4 placeholders para la galería
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
            const user_id = 16; // Cambiar por el ID del usuario logueado
            
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
                            
                            <!-- Menú de 3 puntos para comentarios -->
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
            console.error('Error al cargar comentarios:', error);
            document.getElementById('lista-comentarios').innerHTML = `
                <div class="error-comentarios">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar comentarios</p>
                </div>
            `;
        }
    }

    // ===== FUNCIONES PARA COMENTARIOS (ESTILO PROYECTOS) =====
    let menuComentarioAbierto = null;

    function toggleComentarioMenu(comentarioId, event) {
      event.stopPropagation();
      const menu = document.getElementById(`menu-comentario-${comentarioId}`);
      
      // Cerrar menú anterior si hay uno abierto
      if (menuComentarioAbierto && menuComentarioAbierto !== menu) {
        menuComentarioAbierto.classList.remove('mostrar');
      }
      
      // Alternar el menú actual
      menu.classList.toggle('mostrar');
      menuComentarioAbierto = menu.classList.contains('mostrar') ? menu : null;
    }

    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', function(e) {
      if (menuComentarioAbierto && !e.target.closest('.comentario-acciones')) {
        menuComentarioAbierto.classList.remove('mostrar');
        menuComentarioAbierto = null;
      }
    });

    // Función para editar comentario
    function editarComentario(comentarioId) {
      const comentarioTexto = document.getElementById(`texto-comentario-${comentarioId}`).innerText;
      
      document.getElementById('edit_comentario_id').value = comentarioId;
      document.getElementById('editar-comentario-texto').value = comentarioTexto;
      document.getElementById('edit-contador').textContent = comentarioTexto.length;
      
      // Mostrar modal de edición
      document.getElementById('modal-editar-comentario').style.display = 'flex';
      
      // Cerrar menú
      if (menuComentarioAbierto) {
        menuComentarioAbierto.classList.remove('mostrar');
        menuComentarioAbierto = null;
      }
    }

    // Función para eliminar comentario
    async function eliminarComentario(comentarioId) {
      if (!confirm('¿Estás seguro de que quieres eliminar este comentario?\nEsta acción no se puede deshacer.')) {
        return;
      }

      try {
        const user_id = 16; // Cambiar por el ID del usuario logueado
        
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
          // Recargar los comentarios
          const proyectoId = new URLSearchParams(window.location.search).get('id');
          cargarDetallesProyecto();
        } else {
          alert('❌ Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar comentario');
      }
      
      // Cerrar menú
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

      // Mostrar loading
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
      submitBtn.disabled = true;
      
      try {
        const user_id = 16; // Cambiar por el ID del usuario logueado
        
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
          
          // Cerrar modal
          document.getElementById('modal-editar-comentario').style.display = 'none';
          
          // Recargar comentarios
          cargarDetallesProyecto();
        } else {
          throw new Error(data.message || 'Error al actualizar comentario');
        }
        
      } catch (error) {
        console.error('Error al actualizar comentario:', error);
        alert('❌ Error al actualizar comentario: ' + error.message);
      } finally {
        // Restaurar botón
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

    // Función para formatear fecha CON HORA EXACTA
// Función para formatear fecha con hora actualizada y formato relativo
function formatearFecha(fechaString) {
  try {
    // Si es una fecha reciente (menos de 24 horas), mostrar tiempo relativo
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const diferenciaMinutos = Math.floor(diferencia / (1000 * 60));
    const diferenciaHoras = Math.floor(diferencia / (1000 * 60 * 60));
    
    // Si es hace menos de 1 minuto
    if (diferenciaMinutos < 1) {
      return 'Ahora mismo';
    }
    // Si es hace menos de 1 hora
    else if (diferenciaMinutos < 60) {
      return `Hace ${diferenciaMinutos} minuto${diferenciaMinutos > 1 ? 's' : ''}`;
    }
    // Si es hace menos de 24 horas
    else if (diferenciaHoras < 24) {
      return `Hace ${diferenciaHoras} hora${diferenciaHoras > 1 ? 's' : ''}`;
    }
    // Si es de hoy
    else if (fecha.toDateString() === ahora.toDateString()) {
      return `Hoy a las ${fecha.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    // Si es de ayer
    else if (fecha.toDateString() === new Date(ahora - 86400000).toDateString()) {
      return `Ayer a las ${fecha.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    // Para fechas más antiguas
    else {
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

    // Función para mostrar proyecto de ejemplo si hay error
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
    
// Menú Popover Usuario - CONFIGURACIÓN CORREGIDA
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
      popoverMenu.style.position = 'fixed'; // Cambiar a fixed para mejor posicionamiento
      popoverMenu.style.top = (rect.bottom + 10) + 'px';
      popoverMenu.style.left = (rect.left + rect.width/2 - 160) + 'px';
    }
  });

  // 🔥 NUEVO: Configurar opciones del menú
  document.querySelectorAll('.popover-list li').forEach((li, idx) => {
    li.addEventListener('click', () => {
      console.log('📍 Click en opción del menú:', idx);
      
      switch(idx) {
        case 0: // Perfil
          console.log('👤 Redirigiendo a perfil...');
          window.location.href = '/perfil';
          break;
        case 1: // Configuración
          console.log('⚙️ Redirigiendo a configuración...');
          window.location.href = '/Configuracion';
          break;
        case 2: // Favoritos
          console.log('⭐ Redirigiendo a favoritos...');
          window.location.href = '/favoritos';
          break;
        case 3: // Ayuda
          console.log('❓ Redirigiendo a ayuda...');
          window.location.href = '/ayuda';
          break;
      }
      
      // Cerrar menú
      popoverMenu.style.display = 'none';
    });
  });
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(e) {
  if (popoverMenu && !popoverMenu.contains(e.target) && e.target !== perfilBtn) {
    popoverMenu.style.display = 'none';
  }
});

    // Mostrar modal de reporte
    function mostrarReportarComentarioModal(comentarioId) {
      document.getElementById('modal-reportar-comentario').style.display = 'flex';
      // Aquí puedes guardar el comentarioId para usarlo al reportar
      document.getElementById('modal-reportar-comentario').dataset.comentarioId = comentarioId;
    }

    // Cerrar modal de reporte
    document.getElementById('btn-cancelar-reporte').onclick = function() {
      document.getElementById('modal-reportar-comentario').style.display = 'none';
    };

    // ===== CONTADOR DE CARACTERES PARA COMENTARIOS =====
    document.getElementById('texto-comentario').addEventListener('input', function() {
      const texto = this.value;
      const contador = document.getElementById('contador');
      contador.textContent = texto.length;
      
      if (texto.length > 100) {
        contador.style.color = '#e53e3e';
        contador.style.fontWeight = 'bold';
      } else {
        contador.style.color = '#666';
        contador.style.fontWeight = 'normal';
      }
    });

    // Publicar nuevo comentario - VERSIÓN MEJORADA
    document.getElementById('btn-publicar-comentario').addEventListener('click', async function() {
      const texto = document.getElementById('texto-comentario').value.trim();
      
      // VALIDAR LONGITUD MÁXIMA (100 caracteres)
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
        console.log('Enviando comentario...', { proyectoId, texto });
        
        const response = await fetch(`/api/proyectos/${proyectoId}/comentarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contenido: texto,
            user_id: 16 // Esto debería venir de la sesión
          })
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
          document.getElementById('texto-comentario').value = '';
          document.getElementById('contador').textContent = '0';
          document.getElementById('contador').style.color = '#666';
          alert('✅ Comentario publicado exitosamente');
          cargarDetallesProyecto(); // Recargar para mostrar el nuevo comentario
        } else {
          alert('❌ Error al publicar comentario: ' + data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión al publicar comentario');
      }
    });

    // ===== REDIRECCIÓN DEL LOGO =====
document.addEventListener('DOMContentLoaded', function() {
  const logoHeader = document.querySelector('.logo-header');
  if (logoHeader) {
    logoHeader.style.cursor = 'pointer';
    logoHeader.addEventListener('click', function() {
      window.location.href = '/publicaciones';
    });
  }
});



    // ===== INICIALIZAR =====
    document.addEventListener('DOMContentLoaded', function() {
      cargarDetallesProyecto();
    });