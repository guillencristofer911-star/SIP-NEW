import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'hector',        // CAMBIADO: 'hector' en lugar de 'root'
  password: process.env.DB_PASSWORD || '12345', // CAMBIADO: '12345' en lugar de '21032007'
  database: process.env.DB_NAME || 'bd_sip',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000, // Agregar timeout
  timeout: 60000
});

// Verificar conexión con mejor mensaje
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a la base de datos MySQL - bd_sip');
    console.log('✅ Usuario: hector');
    
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

export default pool;