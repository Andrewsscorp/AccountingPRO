import { Router } from 'express';
import { resolveTenant } from '../middlewares/tenant.middleware';
import multer from 'multer';
import { descargarPlantilla, subirArchivo } from '../controllers/contabilidad/importaciones.controller';

const router = Router();

// Configurar multer para guardar archivos en uploads/importaciones
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Asegurar que la carpeta exista (o crearla)
    const fs = require('fs');
    const dir = './uploads/importaciones';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'importacion-' + uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware obligatorio para todas las rutas
router.use(resolveTenant);

// Generar Plantilla Oficial
router.get('/plantilla', descargarPlantilla);

// Cargar archivo
router.post('/upload', upload.single('archivo'), subirArchivo);

import { generarVistaPrevia, confirmarImportacion } from '../controllers/contabilidad/importaciones.controller';

// Generar Vista Previa y Validar
router.post('/preview', generarVistaPrevia);

// Confirmar Importación y Ejecutar (IMP-005)
router.post('/confirm', confirmarImportacion);

export default router;
