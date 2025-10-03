import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { methods as authController } from "./controllers/authentication.controller.js";
import { verificarToken, verificarAdmin, verificarRol } from "./middlewares/authMiddleware.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server
const app = express();
app.set("port", process.env.PORT || 4000);

// Configuración
app.use(express.json());

// Servir archivos estáticos SOLO desde Public (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "Public")));

// ==================== RUTAS PÚBLICAS ====================

// Páginas HTML públicas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Login.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Registro.html"));
});

app.post("/api/login", authController.login);
app.post("/api/register", authController.register);

// Rutas para recuperación de contraseña
app.post("/api/forgot-password", authController.forgotPassword);
app.post("/api/reset-password", authController.resetPassword);

// Iniciar servidor
app.listen(app.get("port"), () => {
  console.log(`Servidor corriendo en http://localhost:${app.get("port")}`);
});

