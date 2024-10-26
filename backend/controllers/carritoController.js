// controllers/carritoController.js
const { poolPromise } = require('../config/dbConfig'); // Configuración de base de datos
const sql = require('mssql'); // Asegúrate de tener esta importación

const generateTokenCarrito = () => {
    return 'tk' + Math.random().toString(36).substr(2, 16); // Generar token único
};


// Obtener carrito de compras de un usuario
const getCarrito = async (req, res) => {
    const { id_usuario } = req.params; // Obtenemos el id_usuario desde los parámetros
    try {
        const pool = await poolPromise; // Conexión a la base de datos
        
        // Consulta que une Carrito_de_compras con Productos para obtener la imagen
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`SELECT carrito.id_carrito, carrito.id_usuario, carrito.id_producto, carrito.precio, carrito.cantidad, carrito.fecha_agregado, 
       productos.nombre, productos.imagen, 
       tallas.talla AS talla, 
       colores.color AS color
FROM Carrito_de_compras carrito
JOIN Productos productos ON carrito.id_producto = productos.id_producto
JOIN Tallas tallas ON productos.id_talla = tallas.id_talla
JOIN Colores colores ON productos.id_color = colores.id_color
WHERE carrito.id_usuario = id_usuario;
            `);

        if (result.recordset.length === 0) {
            return res.json({ message: 'Tu carrito está vacío' }); // Retornamos un mensaje si el carrito está vacío
        }

        res.json(result.recordset); // Retornamos los productos del carrito con la imagen
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
};

const agregarCarrito = async (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body; 
    try {
        const pool = await poolPromise;

        // Obtener los detalles del producto (nombre y precio) desde la tabla Productos
        const productoQuery = `
            SELECT nombre, precio, imagen 
            FROM Productos 
            WHERE id_producto = @id_producto
        `;
        const productoResult = await pool.request()
            .input('id_producto', sql.Int, id_producto)
            .query(productoQuery);

        const producto = productoResult.recordset[0];

        if (!producto) {
            return res.status(400).json({ message: 'Producto no encontrado' });
        }

        // Verificar si el producto ya está en el carrito del usuario
        const checkQuery = `
            SELECT * FROM Carrito_de_compras
            WHERE id_usuario = @id_usuario AND id_producto = @id_producto
        `;
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_producto', sql.Int, id_producto)
            .query(checkQuery);

        if (result.recordset.length > 0) {
            // Si el producto ya está en el carrito, actualizar la cantidad
            const updateQuery = `
                UPDATE Carrito_de_compras
                SET cantidad = cantidad + @cantidad
                WHERE id_usuario = @id_usuario AND id_producto = @id_producto
            `;
            await pool.request()
                .input('id_usuario', sql.Int, id_usuario)
                .input('id_producto', sql.Int, id_producto)
                .input('cantidad', sql.Int, cantidad)
                .query(updateQuery);
        } else {
            // Si no está en el carrito, agregarlo
            const insertQuery = `
                INSERT INTO Carrito_de_compras (id_usuario, id_producto, precio, cantidad, fecha_agregado, tokenCarrito)
                VALUES (@id_usuario, @id_producto, @precio, @cantidad, GETDATE(), NULL)
            `;
            await pool.request()
                .input('id_usuario', sql.Int, id_usuario)
                .input('id_producto', sql.Int, id_producto)
                .input('precio', sql.Decimal, producto.precio)
                .input('cantidad', sql.Int, cantidad)
                .input('tokenCarrito', sql.NVarChar, req.body.tokenCarrito) // Asumiendo que el token viene en el cuerpo de la solicitud
                .query(insertQuery);
        }

        res.status(200).json({ message: 'Producto agregado al carrito' });
    } catch (err) {
        console.error('Error al agregar el producto al carrito:', err.message);
        res.status(500).json({ error: 'Error al agregar el producto al carrito' });
    }
};



// Agregar productos de localStorage
const agregarProductosDeLocalStorage = async (req, res) => {
    const { id_usuario, carritoLocal } = req.body;
  
    if (!carritoLocal || carritoLocal.length === 0) {
      return res.status(400).send('No hay productos en el carrito');
    }
  
    // Obtener la fecha actual
    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toISOString(); // Fecha en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
  
    try {
      const pool = await poolPromise;
      for (let producto of carritoLocal) {
        const { id_producto, cantidad } = producto;
  
        // Obtener el precio del producto
        const priceQuery = `
          SELECT precio FROM Productos WHERE id_producto = @id_producto
        `;
        const priceResult = await pool.request()
          .input('id_producto', sql.Int, id_producto)
          .query(priceQuery);
        
        const precio = priceResult.recordset[0]?.precio;
  
        if (!precio) {
          return res.status(400).json({ message: 'Producto no encontrado o precio no disponible' });
        }
  
        // Verificar si el producto ya existe en el carrito
        const checkProductQuery = `
          SELECT * FROM Carrito_de_compras WHERE id_usuario = @id_usuario AND id_producto = @id_producto
        `;
        const result = await pool.request()
          .input('id_usuario', sql.Int, id_usuario)
          .input('id_producto', sql.Int, id_producto)
          .query(checkProductQuery);
  
        if (result.recordset.length > 0) {
          // Si ya existe, actualizar la cantidad y el precio
          const updateQuery = `
            UPDATE Carrito_de_compras
            SET cantidad = cantidad + @cantidad, precio = @precio, fecha_agregado = @fecha_agregado
            WHERE id_usuario = @id_usuario AND id_producto = @id_producto
          `;
          await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_producto', sql.Int, id_producto)
            .input('cantidad', sql.Int, cantidad)
            .input('precio', sql.Decimal, precio) // Precio actualizado
            .input('fecha_agregado', sql.DateTime, fechaFormateada) // Enviar la fecha actual
            .query(updateQuery);
        } else {
          // Si no existe, insertar el nuevo producto con el precio
          const insertQuery = `
            INSERT INTO Carrito_de_compras (id_usuario, id_producto, cantidad, precio, fecha_agregado)
            VALUES (@id_usuario, @id_producto, @cantidad, @precio, @fecha_agregado)
          `;
          await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_producto', sql.Int, id_producto)
            .input('cantidad', sql.Int, cantidad)
            .input('precio', sql.Decimal, precio) // Precio actualizado
            .input('fecha_agregado', sql.DateTime, fechaFormateada) // Enviar la fecha actual
            .query(insertQuery);
        }
      }
      res.status(200).send('Productos de localStorage agregados al carrito del usuario');
    } catch (err) {
      console.error('Error al agregar productos:', err.message);
      res.status(500).json({ error: 'Error al agregar productos', details: err.message });
    }
  };
  
// Finalizar la compra y limpiar el carrito
const finalizarCompra = async (req, res) => {
    const { tokenCarrito } = req.body; // El tokenCarrito que se usó durante la compra

    try {
        const pool = await poolPromise;

        // Eliminar productos asociados al tokenCarrito
        const deleteQuery = `
            DELETE FROM Carrito_de_compras WHERE tokenCarrito = @tokenCarrito
        `;
        await pool.request()
            .input('tokenCarrito', sql.NVarChar, tokenCarrito)
            .query(deleteQuery);

        res.status(200).json({ message: 'Compra finalizada y carrito limpiado' });
    } catch (error) {
        console.error('Error al finalizar la compra:', error);
        res.status(500).send('Error al finalizar la compra');
    }
};

// Controlador para aumentar la cantidad de un producto en el carrito
const aumentarCantidad = async (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    try {
        const pool = await poolPromise;

        const query = `
            UPDATE Carrito_de_compras
            SET cantidad = cantidad + @cantidad
            WHERE id_usuario = @id_usuario AND id_producto = @id_producto
        `;
        
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_producto', sql.Int, id_producto)
            .input('cantidad', sql.Int, cantidad)
            .query(query);
        
        res.status(200).json({ message: 'Cantidad aumentada correctamente' });
    } catch (err) {
        console.error('Error al aumentar cantidad:', err.message);
        res.status(500).json({ error: 'Error al aumentar cantidad' });
    }
};

// Controlador para disminuir cantidad
const disminuirCantidad = async (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    try {
        const pool = await poolPromise;

        // Verificar la cantidad actual del producto
        const currentQuery = `
            SELECT cantidad FROM Carrito_de_compras
            WHERE id_usuario = @id_usuario AND id_producto = @id_producto
        `;
        const currentResult = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_producto', sql.Int, id_producto)
            .query(currentQuery);
        
        const currentCantidad = currentResult.recordset[0]?.cantidad;

        if (currentCantidad === undefined) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        // Calcular la nueva cantidad
        const nuevaCantidad = currentCantidad - cantidad;

        if (nuevaCantidad < 0) {
            return res.status(400).json({ error: 'No se puede disminuir la cantidad a menos de 0' });
        }

        // Actualizar la cantidad del producto en el carrito
        const updateQuery = `
            UPDATE Carrito_de_compras
            SET cantidad = @nuevaCantidad
            WHERE id_usuario = @id_usuario AND id_producto = @id_producto
        `;
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_producto', sql.Int, id_producto)
            .input('nuevaCantidad', sql.Int, nuevaCantidad)
            .query(updateQuery);

        // Si la nueva cantidad es 0, eliminar el producto del carrito
        if (nuevaCantidad === 0) {
            const deleteQuery = `
                DELETE FROM Carrito_de_compras 
                WHERE id_usuario = @id_usuario AND id_producto = @id_producto
            `;
            await pool.request()
                .input('id_usuario', sql.Int, id_usuario)
                .input('id_producto', sql.Int, id_producto)
                .query(deleteQuery);
        }

        res.status(200).json({ message: 'Cantidad disminuida correctamente', nuevaCantidad });
    } catch (err) {
        console.error('Error al disminuir cantidad:', err.message);
        res.status(500).json({ error: 'Error al disminuir cantidad' });
    }
};


// Controlador para eliminar un producto del carrito
const eliminarProductoDelCarrito = async (req, res) => {
    const { id_usuario, id_producto } = req.body; // Obtenemos el id_usuario y el id_producto desde el cuerpo de la solicitud

    try {
        const pool = await poolPromise;

        // Consulta para eliminar el producto del carrito del usuario
        const deleteQuery = `
            DELETE FROM Carrito_de_compras 
            WHERE id_usuario = @id_usuario AND id_producto = @id_producto
        `;
        
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_producto', sql.Int, id_producto)
            .query(deleteQuery);

        // Verificar si se eliminó algún registro
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
        }

        res.status(200).json({ message: 'Producto eliminado del carrito correctamente' });
    } catch (err) {
        console.error('Error al eliminar producto del carrito:', err.message);
        res.status(500).json({ error: 'Error al eliminar producto del carrito' });
    }
};


const getResumenCompra = async (req, res) => {
    const { id_usuario } = req.params; // Obtenemos el id_usuario desde los parámetros
    try {
        const pool = await poolPromise;

        // Consulta para obtener los productos, sus cantidades, tallas, colores y precios
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT carrito.id_carrito, carrito.id_usuario, carrito.id_producto, 
                    carrito.precio, carrito.cantidad, productos.nombre, productos.imagen, 
                    tallas.talla AS talla, colores.color AS color
                FROM Carrito_de_compras carrito
                JOIN Productos productos ON carrito.id_producto = productos.id_producto
                JOIN Tallas tallas ON productos.id_talla = tallas.id_talla
                JOIN Colores colores ON productos.id_color = colores.id_color
                WHERE carrito.id_usuario = @id_usuario
            `);

        if (result.recordset.length === 0) {
            return res.json({ message: 'Tu carrito está vacío' });
        }

        // Calculamos el total de la compra
        const productos = result.recordset;
        let total = 0;
        productos.forEach(producto => {
            total += producto.precio * producto.cantidad;
        });

        res.json({ productos, total });
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
};


module.exports = {
    getCarrito,
    agregarCarrito,
    agregarProductosDeLocalStorage,
    finalizarCompra,
    eliminarProductoDelCarrito,
    aumentarCantidad,
    getResumenCompra, 
    disminuirCantidad
};
