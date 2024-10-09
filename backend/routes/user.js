// en tu archivo de rutas (por ejemplo, routes/user.js)
const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/dbConfig');
const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).send('Token requerido');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Token no válido');
    req.user = user; // guardar el usuario en la solicitud
    next();
  });
};

// Ruta para obtener los datos del usuario
router.get('/user', auth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id_usuario', mssql.Int, req.user.user.id_usuario)
      .query('SELECT nombre, apellido, correo FROM Usuarios WHERE id_usuario = @id_usuario');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.recordset[0]); // Devolver los datos del usuario
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
