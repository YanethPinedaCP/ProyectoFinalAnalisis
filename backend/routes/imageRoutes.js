const express = require('express');
const router = express.Router();
const {subirImagen, verImagen} = require('../controllers/imagenesController');

router.post('/image', subirImagen);

router.get('/verimage', verImagen);


module.exports = router;