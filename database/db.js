import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea un pool de conexiones a la base de datos MySQL usando variables de entorno.
 * Permite manejar múltiples conexiones simultáneas de manera eficiente.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sena',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'bd_sip',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Verifica la conexión inicial al pool de la base de datos.
 * Si la conexión es exitosa, muestra un mensaje en consola.
 * Si falla, muestra el error correspondiente.
 */
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a la base de datos MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
  });

/**
 * Exporta el pool de conexiones para ser usado en otras partes de la aplicación.
 */
export default pool;