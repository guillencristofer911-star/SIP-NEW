const palabrasProhibidas = {
  leve: [
    'idiota', 'tonto', 'estúpido', 'imbécil', 'pendejo',
    'baboso', 'menso', 'bobo', 'tarado', 'gil', 'guevon',
    'huevon', 'weon', 'boludo', 'pelotudo'
  ],
  
  medio: [
    'puto', 'puta', 'cabrón', 'cabron', 'hijo de puta', 'hdp',
    'coño', 'carajo', 'joder', 'mierda', 'cagada', 'gonorrea',
    'malparido', 'hijueputa', 'hp', 'verga', 'chimba', 'berraco'
  ],
  
  grave: [
    'negro', 'negra', 'indio', 'india', 'marica', 'maricon',
    'pirobo', 'sapo', 'rata', 'mk', 'malparido',
    'matar', 'muerte', 'asesinar', 'violar', 'secuestrar'
  ]
};

class FiltroPalabrasProhibidas {
  constructor(palabras = palabrasProhibidas) {
    this.palabras = palabras;
    this.regexLeve = this.crearRegex(palabras.leve);
    this.regexMedio = this.crearRegex(palabras.medio);
    this.regexGrave = this.crearRegex(palabras.grave);
  }
  
  crearRegex(listaPalabras) {
    const pattern = listaPalabras
      .map(palabra => palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    
    return new RegExp(`\\b(${pattern})\\b`, 'gi');
  }
  
  detectarNivel(texto) {
    if (this.regexGrave.test(texto)) return 'grave';
    if (this.regexMedio.test(texto)) return 'medio';
    if (this.regexLeve.test(texto)) return 'leve';
    return 'limpio';
  }
  
  censurarTexto(texto) {
    let textoCensurado = texto;
    
    textoCensurado = textoCensurado.replace(this.regexLeve, (match) => {
      return match[0] + '*'.repeat(match.length - 1);
    });
    
    textoCensurado = textoCensurado.replace(this.regexMedio, (match) => {
      return match[0] + '*'.repeat(match.length - 1);
    });
    
    textoCensurado = textoCensurado.replace(this.regexGrave, (match) => {
      return match[0] + '*'.repeat(match.length - 1);
    });
    
    return textoCensurado;
  }
  
  analizarContenido(texto) {
    if (!texto || typeof texto !== 'string') {
      return {
        original: texto,
        censurado: texto,
        nivel: 'limpio',
        requiereModeracion: false,
        esLimpio: true
      };
    }

    const nivel = this.detectarNivel(texto);
    const textoCensurado = this.censurarTexto(texto);
    const requiereModeracion = nivel === 'grave';
    
    return {
      original: texto,
      censurado: textoCensurado,
      nivel: nivel,
      requiereModeracion: requiereModeracion,
      esLimpio: nivel === 'limpio'
    };
  }
}

const filtro = new FiltroPalabrasProhibidas();

export { FiltroPalabrasProhibidas, filtro, palabrasProhibidas };