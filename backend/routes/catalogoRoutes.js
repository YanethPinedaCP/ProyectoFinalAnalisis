// routes/productoRoutes.js
const express = require('express');
const { obtenerGeneros, obtenerTalla, obtenerColor, obtenerMetodoPago} = require('../controllers/catalogosController');

const router = express.Router();

router.get('/genero', obtenerGeneros);

router.get('/tallas', obtenerTalla);

router.get('/colores', obtenerColor);

router.get('/metodo_pago', obtenerMetodoPago);

module.exports = router;
