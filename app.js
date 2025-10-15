import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import publicacionesRoutes from "./routes/publicaciones.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/publicaciones", publicacionesRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
