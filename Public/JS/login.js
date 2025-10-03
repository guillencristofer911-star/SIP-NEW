// Modal recuperar contraseña
document.getElementById('enlace-olvido').onclick = function(e) {
  e.preventDefault();
  document.getElementById('modal-recuperar').classList.add('activo');
};

document.getElementById('cerrar-modal').onclick = function() {
  document.getElementById('modal-recuperar').classList.remove('activo');
};

// Manejo del formulario de login
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
        
        alert("Login exitoso. Bienvenido " + responseData.usuario.nombre);
        
        // Redirigir a Sesión_publicados.html
        window.location.href = "/publicaciones";
        
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