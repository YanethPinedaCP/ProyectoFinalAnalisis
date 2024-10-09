// routes/usuarioRoutes.js
const express = require('express');
const { login, registro } = require('../controllers/autentificacionController');
const router = express.Router();

router.post('/login', login);
router.post('/registro', registro);

module.exports = router;
