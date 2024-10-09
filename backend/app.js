// app.js o tu archivo principal
const express = require('express');
const cors = require('cors');
const productoRoutes = require('./routes/productoRoutes');
const carritoRoutes = require('../backend/routes/carritoRoutes');
const session = require('express-session');
const usuarioRoutes = require('./routes/usuarioRoutes');


require('dotenv').config();

const port = 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'mi_secreto_super_seguro', // Cambia esto por algo más seguro
  resave: false,  // No reescribas la sesión si no se ha modificado
  saveUninitialized: false,  // No guardes sesiones vacías
  cookie: { secure: false }  // Cambia a true si usas HTTPS
}));


// Ruta para ver si la API va corriendo
app.get('/', (req, res) => {
    res.send('Bienvenidos a LRoss API');
});

// Rutas API productos
app.use('/api', productoRoutes);

// Rutas API para carrito
app.use('/carrito', carritoRoutes);

app.use('/api/usuarios', usuarioRoutes);

// Ruta para agregar un producto al carrito
app.post('/carrito/agregarcarro', (req, res) => {
  const producto = req.body;
  // Verificar si el producto ya existe en el carrito
  const index = req.session.carrito.findIndex(item => item.id_producto === producto.id_producto);
  
  if (index !== -1) {
      // Si ya existe, aumentar la cantidad
      req.session.carrito[index].cantidad += 1;
  } else {
      // Si no existe, agregarlo
      producto.cantidad = 1; // Inicializar cantidad
      req.session.carrito.push(producto);
  }

  res.json({ message: 'Producto agregado al carrito', carrito: req.session.carrito });
});

// Ruta para mostrar el carrito
app.get('/carrito/mostrarcarro', (req, res) => {
  res.json({ carrito: req.session.carrito });
});


// Levanta el servidor
app.listen(port, () => {
    console.log(`El servidor está corriendo en http://localhost:${port}`);
});
