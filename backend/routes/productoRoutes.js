// routes/productoRoutes.js
const express = require('express');
const { getProductos, agregarProducto } = require('../controllers/productoController');

const router = express.Router();

router.get('/productos', getProductos);

router.post('/agregar/productos', agregarProducto);

module.exports = router;
