import express from 'express';
import { filtro } from '../utils/filtroPalabras.js';

const router = express.Router();

// POST /api/filtro
router.post('/filtro', (req, res) => {
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({ error: 'Debes enviar un texto en el body.' });
  }

  const resultado = filtro.analizarContenido(texto);
  res.json({
    mensaje: 'Análisis realizado correctamente',
    resultado,
  });
});

export default router;
