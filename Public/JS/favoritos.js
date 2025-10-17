document.querySelectorAll(".btn-favorito").forEach(boton => {
  boton.addEventListener("click", async () => {
    const token = localStorage.getItem("token"); // o de donde lo guardes
    const ID_publicacion = boton.getAttribute("data-id-publicacion");
    const usuario = JSON.parse(localStorage.getItem("usuario")); // ejemplo
    const ID_usuario = usuario?.id;

    const res = await fetch("/api/favoritos/agregar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ ID_usuario, ID_publicacion })
    });

    const data = await res.json();
    alert(data.message);
  });
});
