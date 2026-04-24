const express = require('express');
const router = express.Router();
const controlController = require('../controllers/controlController');
const authMiddleware = require('../middleware/auth'); 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Los archivos se guardarán en una carpeta llamada 'uploads'

// Ruta para subir el archivo
router.post('/subir-evidencia', upload.single('archivo'), controlController.subirArchivo);

// GET para obtener los 93 controles
router.get('/', authMiddleware, controlController.obtenerControles);

// POST para guardar los avances
router.post('/guardar', authMiddleware, controlController.guardarProgreso);

module.exports = router;
