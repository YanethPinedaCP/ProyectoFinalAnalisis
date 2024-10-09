const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController'); // Asegúrate de que esta ruta sea correcta

// Verificar que el controlador está definido
console.log(carritoController); // Esto debería imprimir el objeto con los métodos


router.use(carritoController.initCarrito);
// Ruta para agregar un producto al carrito
router.post('/agregarcarro', carritoController.agregarAlCarrito);

// Ruta para mostrar el carrito
router.get('/mostrarcarro', carritoController.mostrarCarrito);
module.exports = router;
