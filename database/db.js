import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea un pool de conexiones a la base de datos MySQL usando variables de entorno.
 * Permite manejar múltiples conexiones simultáneas de manera eficiente.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bd_sip',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000, // Agregar timeout
  timeout: 60000
});

// Verificar conexión con mejor mensaje
/**
 * Verifica la conexión inicial al pool de la base de datos.
 * Si la conexión es exitosa, muestra un mensaje en consola.
 * Si falla, muestra el error correspondiente.
 */
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a la base de datos MySQL - bd_sip');
    console.log('✅ Usuario: root');
    
    // Verificar que podemos hacer consultas
    return connection.query('SELECT COUNT(*) as total FROM usuario')
      .then(([rows]) => {
        console.log(`✅ Usuarios registrados: ${rows[0].total}`);
        connection.release();
      });
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    console.log('💡 Verifica:');
    console.log('   - MySQL está ejecutándose en XAMPP');
    console.log('   - Usuario: hector existe en MySQL');
    console.log('   - Contraseña correcta');
    process.exit(1);
  });

/**
 * Exporta el pool de conexiones para ser usado en otras partes de la aplicación.
 */
export default pool;