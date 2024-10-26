const express = require('express');
const { getTiposSoporte, enviarSoporte,
    getReportesSoporte,
    actualizarSoporte,} = require('../controllers/soporteController');

const router = express.Router();

// Obtener un usuario por su ID
router.get('/tipossoporte', getTiposSoporte);

router.post('/enviarsoporte', enviarSoporte);

router.get('/', getReportesSoporte);

router.put('/actualizarsoporte/:id_soporte', actualizarSoporte);






module.exports = router;
