const express = require('express');
const { getUsuarios } = require('../controllers/usuariosController');

const router = express.Router();

// Obtener un usuario por su ID
router.get('/:id_usuario', getUsuarios);

module.exports = router;
