const express = require('express');
const router = express.Router();
const controlController = require('../controllers/controlController');
const authMiddleware = require('../middleware/auth'); // El que definimos antes

// GET para obtener los 93 controles
router.get('/', authMiddleware, controlController.obtenerControles);

// POST para guardar el progreso (checklist)
router.post('/progreso', authMiddleware, controlController.actualizarProgreso);

module.exports = router;