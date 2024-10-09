const carritoController = {

  // Middleware para inicializar el carrito en la sesión
  initCarrito: (req, res, next) => {
      if (!req.session.carrito) {
          req.session.carrito = [];
      }
      next();
  },

  agregarAlCarrito: (req, res) => {
      const producto = req.body; // Datos del producto enviados desde el frontend

      // Obtener el carrito actual de la sesión
      const carrito = req.session.carrito;

      // Verificar si el producto ya está en el carrito
      const productoExistente = carrito.find(item => item.id === producto.id);

      if (productoExistente) {
          // Si el producto ya existe, aumentar la cantidad
          productoExistente.cantidad += 1;
      } else {
          // Si no existe, agregarlo con cantidad inicial 1
          producto.cantidad = 1;
          carrito.push(producto);
      }

      // Guardar el carrito actualizado en la sesión
      req.session.carrito = carrito;

      // Retornar respuesta
      res.json({
          message: 'Producto agregado al carrito',
          carrito: req.session.carrito
      });
  },

  mostrarCarrito: (req, res) => {
      const carrito = req.session.carrito || [];
      res.json({
          message: carrito.length > 0 ? 'Carrito obtenido' : 'El carrito está vacío',
          carrito
      });
  }
};

module.exports = carritoController;
