// ==================== MANEJO DEL MODAL DE RECUPERAR CONTRASEÑA ====================
/**
 * Muestra el modal de recuperación de contraseña al hacer clic en el enlace.
 */
document.getElementById('enlace-olvido').onclick = function(e) {
  e.preventDefault();
  document.getElementById('modal-recuperar').classList.add('activo');
};

/**
 * Cierra el modal de recuperación de contraseña al hacer clic en el botón de cerrar.
 */
document.getElementById('cerrar-modal').onclick = function() {
  document.getElementById('modal-recuperar').classList.remove('activo');
};

// ==================== MANEJO DEL FORMULARIO DE LOGIN ====================
/**
 * Obtiene el formulario de login y agrega el listener para el evento submit.
 * Realiza validaciones, envía la solicitud al backend y maneja la respuesta.
 */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    const data = {
      documento: form["usuario"].value.trim(),
      contrasena: form["contrasena"].value
    };
    
    if (!data.documento || !data.contrasena) {
      alert("Por favor completa todos los campos");
      return;
    }
    if (!/^\d+$/.test(data.documento)) {
      alert("El documento debe contener solo números");
      return;
    }
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Iniciando sesión...";
    }
    
    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      
      if (res.ok) {
        localStorage.setItem("token", responseData.token);
        localStorage.setItem("usuario", JSON.stringify(responseData.usuario));
        
        // 🔥 REDIRIGIR SEGÚN EL ROL
        const usuario = responseData.usuario;
        
        if (usuario.rol === 1) {
          // ADMIN → Panel de administración
          console.log('✅ Login como ADMIN:', usuario.nombre);
          alert("Bienvenido Administrador " + usuario.nombre);
          window.location.href = "/admin/panel";
        } else {
          // USUARIO NORMAL → Feed de publicaciones
          console.log('✅ Login como USUARIO:', usuario.nombre);
          alert("Login exitoso. Bienvenido " + usuario.nombre);
          window.location.href = "/publicaciones";
        }
        
      } else {
        alert(responseData.message || "Error en el login");
        
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Iniciar Sesión";
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con el servidor");
      
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Iniciar Sesión";
      }
    }
  });
}