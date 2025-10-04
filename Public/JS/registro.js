document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('modal-terms');
  const registerForm = document.getElementById('register-form');

  // Modal de términos
  if (openModalBtn) {
    openModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('active');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Manejo del formulario de registro
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Obtener datos del formulario
      const formData = new FormData(registerForm);
      
      // Validar que las contraseñas coincidan
      const contrasena = formData.get('contrasena');
      const confirmarContrasena = formData.get('confirmar_contrasena');

      if (contrasena !== confirmarContrasena) {
        alert('Las contraseñas no coinciden');
        return;
      }

      // Validar que los términos estén aceptados
      const terminos = formData.get('terminos');
      if (!terminos) {
        alert('Debes aceptar los términos y condiciones');
        return;
      }

      // Crear objeto con los datos (sin incluir terminos ni tipo ya que no se usan en backend)
      const datos = {
        documento: formData.get('documento'),
        nombres: formData.get('nombres'),
        apellidos: formData.get('apellidos'),
        correo: formData.get('correo'),
        programa: formData.get('programa'),
        contrasena: formData.get('contrasena'),
        confirmar_contrasena: formData.get('confirmar_contrasena')
      };

      console.log('Datos a enviar:', datos); // Para debug

      try {
        const response = await fetch('http://localhost:4000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datos)
        });

        const result = await response.json();

        if (response.ok) {
          alert('¡Registro exitoso! Ahora puedes iniciar sesión');
          window.location.href = '/login';
        } else {
          alert(result.message || 'Error en el registro');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
      }
    });
  }
});