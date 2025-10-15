import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Conectar y verificar
connection.connect((error) => {
  if (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
  } else {
    console.log("✅ Conectado a la base de datos MySQL:", process.env.DB_NAME);
  }
});

export default connection;

