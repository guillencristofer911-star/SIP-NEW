//// 🔥 middleware/filtroPalabrasMiddleware.js



const palabrasProhibidas = [
  "grosería1",
  "grosería2",
  "insulto",
  "mala",
  "ofensiva"
];

// 👉 Función utilitaria para analizar texto
export const filtro = {
  analizarContenido: (texto = "") => {
    let censurado = texto;
    let requiereModeracion = false;

    for (const palabra of palabrasProhibidas) {
      const regex = new RegExp(palabra, "gi");
      if (regex.test(texto)) {
        requiereModeracion = true;
        censurado = censurado.replace(regex, "***");
      }
    }

    return { censurado, requiereModeracion };
  }
};

// 👉 Middleware para usar en rutas si se necesita validación directa
const filtroPalabrasMiddleware = (req, res, next) => {
  const texto =
    req.body?.texto ||
    req.body?.comentario ||
    req.body?.descripcion ||
    "";

  const contieneProhibida = palabrasProhibidas.some(palabra =>
    texto.toLowerCase().includes(palabra.toLowerCase())
  );

  if (contieneProhibida) {
    return res
      .status(400)
      .json({ mensaje: "Tu texto contiene palabras no permitidas." });
  }

  next();
};

export default filtroPalabrasMiddleware;
