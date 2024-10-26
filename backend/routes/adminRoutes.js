const express = require('express');
const { getUsuariosAdmin, registroAdmin, getUsuariosClientes, actualizarAdmin } = require('../controllers/usuariosadminController');

const router = express.Router();

// Obtener un usuario por su ID
router.get('/', getUsuariosAdmin);

router.post('/registraradmin', registroAdmin);

router.get('/clientes', getUsuariosClientes);

router.put('/:id_usuario', actualizarAdmin); // Asumiendo que el ID del administrador se pasa como parámetro en la URL



module.exports = router;
