// routes/usuarioRoutes.js
const express = require('express');
const { login, registro, verificarEnlace, reenviarVerificacion, 
    recuperarContraseña, restablecerContraseña,
    verificarTokenRecuperacion} = require('../controllers/autentificacionController');

const router = express.Router();

router.post('/login', login);
router.post('/registro', registro);
router.get('/verificar-correo', verificarEnlace);
router.post('/resend-verification', reenviarVerificacion);
//CAMBIO DE CONTRASE;A 
router.post('/restablecer-contrasena', recuperarContraseña);
router.get('/verificar-token/:token', verificarTokenRecuperacion);
router.put('/cambiar-contrasena', restablecerContraseña);


module.exports = router;
