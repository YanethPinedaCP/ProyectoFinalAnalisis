// routes/carritoRoutes.js
const express = require('express');
const {getventaspendientes, confirmarcompra, getVentas } = require('../controllers/ventasController'); // Importar el controlador

const router = express.Router();


router.get('/pendientes', getventaspendientes);  // Nueva ruta

router.post('/confirmarventa', confirmarcompra);

router.get('/confirmadas', getVentas);  // Nueva ruta


module.exports = router;