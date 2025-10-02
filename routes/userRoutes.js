import express from 'express';
import { methods as userController } from '../controllers/controller.js';

const router = express.Router();

// Ruta para enviar enlace de recuperación
router.post('/forgot-password', userController.forgotPassword);

// Ruta para cambiar la contraseña usando el token
router.post('/reset-password', userController.resetPassword);

export default router;
