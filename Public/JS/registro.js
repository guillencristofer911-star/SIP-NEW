const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const form = e.target;
  
  const data = {
    documento: form["documento"].value,
    nombres: form["nombres"].value,
    apellidos: form["apellidos"].value,
    correo: form["correo"].value,
    programa: form["programa"].value,
    contrasena: form["contrasena"].value,
    confirmar_contrasena: form["confirmar_contrasena"].value
  };
  
  try {
    const res = await fetch("http://localhost:4000/api/register", {  // <- CAMBIO AQUÍ
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const responseData = await res.json();

    if (res.ok) {
      alert("Registro exitoso");
      window.location.href = "/login";
    } else {
      if (mensajeError) {
        mensajeError.textContent = responseData.message || "Error en el registro";
        mensajeError.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error:", error);
    if (mensajeError) {
      mensajeError.textContent = "Error de conexión con el servidor";
      mensajeError.style.display = "block";
    }
  }
});