import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { methods as authController } from "./controllers/authentication.controller.js"; 


//Server
const app = express();
app.set("port", 4000);

// Configuración
app.use(express.json());

// Servir archivos estáticos SOLO desde Public (CSS, JS, imágenes)
// NO incluir Pages aquí
app.use(express.static(path.join(__dirname, "Public")));

// Rutas ESPECÍFICAS primero (antes de cualquier otra cosa)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Login.html"));
});


app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "Pages", "Registro.html"));
});

app.post("/api/login",authController.login);
app.post("/api/register", authController.register);




// Iniciar servidor
app.listen(app.get("port"), () => {
  console.log(`Servidor corriendo en http://localhost:${app.get("port")}`);
});