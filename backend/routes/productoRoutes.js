// routes/productoRoutes.js
const express = require('express');
const { getProductos, agregarProducto, actualizarProducto, EliminarProducto, lomasnuevo, enTendencia
 } = require('../controllers/productoController');

const router = express.Router();

router.get('/productos', getProductos);

router.post('/agregar/productos', agregarProducto);

router.put('/producto/:id_producto', actualizarProducto);

router.patch('/producto/eliminar/:id_producto', EliminarProducto);

router.get('/productos/nuevos', lomasnuevo);

router.get('/productos/entendencia', enTendencia );


module.exports = router;
