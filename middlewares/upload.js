import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 CREAR CARPETA uploads SI NO EXISTE
const uploadDir = path.join(__dirname, '../Public/uploads/');
if (!fs.existsSync(uploadDir)) {
    console.log('📁 Creando carpeta uploads...');
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Carpeta uploads creada exitosamente');
} else {
    console.log('✅ Carpeta uploads ya existe');
}

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('📂 Guardando archivo en:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'proyecto-' + uniqueSuffix + path.extname(file.originalname);
        console.log('📝 Nombre de archivo:', filename);
        cb(null, filename);
    }
});

// Filtrar tipos de archivo
const fileFilter = (req, file, cb) => {
    console.log('🔍 Validando archivo:', file.fieldname, file.mimetype);
    
    if (file.fieldname === 'imagenes') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, etc.)'), false);
        }
    } else if (file.fieldname === 'documento_pdf') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    } else {
        cb(null, true);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB límite
        files: 6 // Máximo 5 imágenes + 1 PDF
    }
});

console.log('✅ Multer configurado correctamente');
console.log('📍 Carpeta de uploads:', uploadDir);