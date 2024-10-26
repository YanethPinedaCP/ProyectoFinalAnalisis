// routes/carritoRoutes.js
const express = require('express');
const {getResumenCompra, finalizarCompra, getCompra } = require('../controllers/ordenarController'); // Importar el controlador

const router = express.Router();


router.get('/resumen/:id_usuario', getResumenCompra);  // Nueva ruta

router.post('/finalizarCompra', finalizarCompra);  // Nueva ruta

router.get('/compras/:id_pedido', getCompra);




module.exports = router;