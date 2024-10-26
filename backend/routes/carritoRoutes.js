// routes/carritoRoutes.js
const express = require('express');
const { getCarrito, agregarCarrito, agregarProductosDeLocalStorage, finalizarCompra, eliminarProductoDelCarrito, aumentarCantidad, getResumenCompra, disminuirCantidad } = require('../controllers/carritoController'); // Importar el controlador

const router = express.Router();

// Ruta para obtener el carrito de un usuario por su ID
router.get('/:id_usuario', getCarrito);

// Ruta para agregar un producto al carrito
router.post('/agregar', agregarCarrito);

router.post('/agregarDeLocalStorage', agregarProductosDeLocalStorage);  // Nueva ruta

router.get('/resumen/:id_usuario', getResumenCompra);  // Nueva ruta

// Ruta para aumentar cantidad
router.put('/aumentar', aumentarCantidad);

// Ruta para disminuir cantidad
router.put('/disminuir', disminuirCantidad);

router.delete('/eliminar/', eliminarProductoDelCarrito);

module.exports = router;
