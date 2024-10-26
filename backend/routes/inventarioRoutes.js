// routes/productoRoutes.js
const express = require('express');
const { getProductosInv, getProductomenosStock,
    getProductosAgotados, getProductosInac, getProductosPorCategoria} = require('../controllers/gestionController');

const router = express.Router();

router.get('/productos/activos', getProductosInv);

router.get('/productos/menosstock', getProductomenosStock);

router.get('/productos/agotados', getProductosAgotados);

router.get('/productos/inactivos', getProductosInac);

router.get('/productos/categoria/:id_categoria', getProductosPorCategoria);




module.exports = router;
