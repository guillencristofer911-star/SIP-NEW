// ============================================================
// 🚫 Filtro avanzado de palabras prohibidas
// ============================================================

const palabrasProhibidas = {
  leve: [
    'idiota', 'tonto', 'estupido', 'imbecil', 'pendejo',
    'baboso', 'menso', 'bobo', 'tarado', 'gil', 'guevon',
    'huevon', 'weon', 'boludo', 'pelotudo'
  ],
  medio: [
    'puto', 'puta', 'cabron', 'hijo de puta', 'hdp',
    'coño', 'carajo', 'joder', 'mierda', 'cagada', 'gonorrea',
    'malparido', 'hijueputa', 'hp', 'verga', 'chimba', 'berraco'
  ],
  grave: [
    'negro', 'negra', 'indio', 'india', 'marica', 'maricon',
    'pirobo', 'sapo', 'rata', 'mk', 'malparido',
    'matar', 'muerte', 'asesinar', 'violar', 'secuestrar'
  ]
};

// ============================================================
// 🔤 Normaliza texto (quita tildes y símbolos usados para disimular)
// ============================================================
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/[@$!*#%&_.\-]/g, "a")  // reemplaza símbolos comunes
    .replace(/[0o]/g, "o")
    .replace(/[1íìïîl|!]/g, "i")
    .replace(/[3eèéêë]/g, "e")
    .replace(/[4áàäâ]/g, "a")
    .replace(/[5s$]/g, "s")
    .replace(/[7t+]/g, "t")
    .replace(/[8b]/g, "b")
    .replace(/[9g]/g, "g")
    .toLowerCase();
}

// ============================================================
// 🧠 Clase principal del filtro
// ============================================================
class FiltroPalabrasProhibidas {
  constructor(palabras = palabrasProhibidas) {
    this.palabras = palabras;
    this.regexLeve = this.crearRegex(palabras.leve);
    this.regexMedio = this.crearRegex(palabras.medio);
    this.regexGrave = this.crearRegex(palabras.grave);
  }

  crearRegex(listaPalabras) {
    const pattern = listaPalabras
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    return new RegExp(`\\b(${pattern})\\b`, "gi");
  }

  detectarNivel(texto) {
    const limpio = normalizarTexto(texto);
    if (this.regexGrave.test(limpio)) return "grave";
    if (this.regexMedio.test(limpio)) return "medio";
    if (this.regexLeve.test(limpio)) return "leve";
    return "limpio";
  }

  // 🔥 Censura respetando las tildes o símbolos
  censurarTexto(texto) {
    let textoCensurado = texto;

    const censurar = (listaPalabras) => {
      for (const palabra of listaPalabras) {
        // crear regex tolerante a tildes o símbolos dentro de las letras
        const pattern = palabra
          .split("")
          .map(letra => {
            const base = letra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return `[${base}${base.toUpperCase()}${letra.toUpperCase()}${letra}]([@#$*!.,_\\-0-9]*)?`;
          })
          .join("");

        const regex = new RegExp(pattern, "gi");

        textoCensurado = textoCensurado.replace(regex, match => {
          return match[0] + "*".repeat(match.length - 1);
        });
      }
    };

    censurar(this.palabras.leve);
    censurar(this.palabras.medio);
    censurar(this.palabras.grave);

    return textoCensurado;
  }

  analizarContenido(texto) {
    if (!texto || typeof texto !== "string") {
      return {
        original: texto,
        censurado: texto,
        nivel: "limpio",
        requiereModeracion: false,
        esLimpio: true
      };
    }

    const nivel = this.detectarNivel(texto);
    const textoCensurado = this.censurarTexto(texto);
    const requiereModeracion = nivel === "grave";

    return {
      original: texto,
      censurado: textoCensurado,
      nivel,
      requiereModeracion,
      esLimpio: nivel === "limpio"
    };
  }
}

// ============================================================
// Exportación
// ============================================================
const filtro = new FiltroPalabrasProhibidas();

export { FiltroPalabrasProhibidas, filtro, palabrasProhibidas };
