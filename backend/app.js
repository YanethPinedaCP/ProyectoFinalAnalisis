const express = require('express');
const cors = require('cors');
const productoRoutes = require('./routes/productoRoutes');
const session = require('express-session');
const usuarioRoutes = require('./routes/usuarioRoutes');
const categoriaRoutes = require('./routes/CategoriaRoutes');
const imagenesRoutes = require('./routes/imageRoutes');
const carritoRoutes = require('./routes/carritoRoutes'); // Aseguramos que las rutas del carrito están correctas
const catalogoRoutes = require('./routes/catalogoRoutes'); // Aseguramos que las rutas del carrito están correctas
const resumenRoutes = require('./routes/resumenRoutes'); // Aseguramos que las rutas del carrito están correctas
const usuariosRoutes = require('./routes/usuariosRoutes'); // Aseguramos que las rutas del carrito están correctas
const adminRoutes = require('./routes/adminRoutes'); // Aseguramos que las rutas del carrito están correctas
const inventarioRoutes = require('./routes/inventarioRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const soporteRoutes = require('./routes/soporteRoutes');

require('dotenv').config();

const port = 5000;
const app = express();

app.use(cors({
  origin: 'http://localhost:3000'
}));

// Middleware
app.use(cors());
app.use(express.json()); // Middleware para manejar cuerpos JSON

// Configuración de sesiones
app.use(session({
  secret: 'mi_secreto_super_seguro', // Asegúrate de cambiar esto por algo más seguro
  resave: false,  // No reescribir la sesión si no se ha modificado
  saveUninitialized: false,  // No guardar sesiones vacías
  cookie: { secure: false }  // Cambia a true si usas HTTPS en producción
}));

// Ruta para verificar que la API está corriendo
app.get('/', (req, res) => {
    res.send('Bienvenidos a LRoss API');
});

// Rutas de productos
app.use('/api', productoRoutes);

// Rutas para gestionar el carrito de compras
app.use('/api/carrito', carritoRoutes); // Usa las rutas de carrito definidas en carritoRoutes.js

// Rutas de usuarios
app.use('/api/usuarios', usuarioRoutes);

// Rutas de categorías
app.use('/api', categoriaRoutes);

// Rutas para imágenes
app.use('/upload', imagenesRoutes);

//Ruta generos
app.use('/api', catalogoRoutes);

//Resumen Ruta
app.use('/api', resumenRoutes);

//Usauaurio rutas
app.use('/api/usr', usuariosRoutes);

//Usuarios administradores

app.use('/api/admins', adminRoutes);

//Inventario gestion rutas
app.use('/api/inventario', inventarioRoutes);

//Vnetas
app.use('/api/ventas', ventasRoutes);

//Soporte rutas
app.use('/api/soporte', soporteRoutes);







// Levantar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
