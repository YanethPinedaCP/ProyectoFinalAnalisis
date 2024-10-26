// routes/productoRoutes.js
const express = require('express');
const { getCategorias } = require('../controllers/categoriaController');

const router = express.Router();


router.get('/categorias', getCategorias)

module.exports = router;
