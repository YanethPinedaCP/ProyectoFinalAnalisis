const { poolPromise } = require('../config/dbConfig');
const sql = require('mssql');


// Obtener todos los géneros
const obtenerGeneros = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Generos'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).send('Error al obtener categorías');
    }
};

// Obtener todos los géneros
const obtenerTalla = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Tallas'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener Talla:', err);
        res.status(500).send('Error al obtener Talla');
    }
};

const obtenerColor = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Colores'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener Colores:', err);
        res.status(500).send('Error al obtener Colores');
    }
};

//STOCK 
  const actualizarStock = async (req, res) => {
    const { id_producto, cantidad } = req.body;
  
    if (!id_producto || !cantidad || cantidad <= 0) {
      return res.status(400).json({ message: 'Debe especificar una cantidad válida' });
    }
  
    try {
      const pool = await poolPromise;
  
      // Obtener el stock actual del producto
      const result = await pool.request()
        .input('id_producto', sql.Int, id_producto)
        .query('SELECT stock FROM Productos WHERE id_producto = @id_producto');
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
  
      const producto = result.recordset[0];
      const nuevoStock = producto.stock - cantidad;
  
      if (nuevoStock < 0) {
        return res.status(400).json({ message: 'No hay suficiente stock para realizar la venta' });
      }
  
      // Actualizar el stock
      const query = `
        UPDATE Productos
        SET stock = @nuevoStock
        WHERE id_producto = @id_producto
      `;
  
      await pool.request()
        .input('id_producto', sql.Int, id_producto)
        .input('nuevoStock', sql.Int, nuevoStock)
        .query(query);
  
      res.status(200).json({ message: 'Stock actualizado exitosamente', nuevoStock });
    } catch (error) {
      console.error('Error actualizando el stock', error);
      res.status(500).json({ message: 'Error al actualizar el stock' });
    }
  };

  const reponerStock = async (req, res) => {
    const { id_producto, cantidad } = req.body;
  
    if (!id_producto || !cantidad || cantidad <= 0) {
      return res.status(400).json({ message: 'Debe especificar una cantidad válida para reponer el stock' });
    }
  
    try {
      const pool = await poolPromise;
  
      // Obtener el stock actual del producto
      const result = await pool.request()
        .input('id_producto', sql.Int, id_producto)
        .query('SELECT stock FROM Productos WHERE id_producto = @id_producto');
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
  
      const producto = result.recordset[0];
      const nuevoStock = producto.stock + cantidad;
  
      // Actualizar el stock
      const query = `
        UPDATE Productos
        SET stock = @nuevoStock
        WHERE id_producto = @id_producto
      `;
  
      await pool.request()
        .input('id_producto', sql.Int, id_producto)
        .input('nuevoStock', sql.Int, nuevoStock)
        .query(query);
  
      res.status(200).json({ message: 'Stock repuesto exitosamente', nuevoStock });
    } catch (error) {
      console.error('Error reponiendo el stock', error);
      res.status(500).json({ message: 'Error al reponer el stock' });
    }
  };

  // Función para restar el stock cuando se realiza una compra
const restarStock = async (req, res) => {
    const { id_producto, cantidad } = req.body;  // Recibimos el ID del producto y la cantidad vendida
  
    // Verifica si la cantidad es válida
    if (!id_producto || !cantidad || cantidad <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }
  
    try {
      const pool = await poolPromise;  // Espera la conexión a la base de datos
  
      // Primero, obtenemos el stock actual del producto
      const producto = await pool.request()
        .input('id_producto', sql.Int, id_producto)
        .query('SELECT stock FROM Productos WHERE id_producto = @id_producto AND id_estado = 1');  // Solo productos activos
  
      if (producto.recordset.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado o inactivo' });
      }
  
      const stockActual = producto.recordset[0].stock;
  
      // Verificamos si hay suficiente stock para la venta
      if (stockActual < cantidad) {
        return res.status(400).json({ message: 'Stock insuficiente para la venta' });
      }
  
      // Calculamos el nuevo stock
      const nuevoStock = stockActual - cantidad;
  
      // Si el stock es 1 o menos, marcamos el producto como inactivo
      let query = 'UPDATE Productos SET stock = @nuevoStock';
      if (nuevoStock === 0) {
        query += ', id_estado = 2';  // Marca el producto como inactivo si el stock llega a 0
      }
      query += ' WHERE id_producto = @id_producto';
  
      // Actualizamos el stock y el estado del producto
      await pool.request()
        .input('id_producto', sql.Int, id_producto)
        .input('nuevoStock', sql.Int, nuevoStock)
        .query(query);
  
      res.status(200).json({ message: 'Stock actualizado correctamente' });
  
    } catch (error) {
      console.error('Error al restar stock', error);
      res.status(500).json({ message: 'Error al actualizar el stock' });
    }
  };
  
  const EliminarProducto = async (req, res) => {
    const { id_producto } = req.params;
  
    try {
      const pool = await poolPromise;
  
      const query = `
        UPDATE Productos
        SET id_estado = 2 WHERE id_producto = @id_producto
      `;
  
      await pool.request()
        .input('id_producto', sql.Int, id_producto)
        .query(query);
  
      console.log('Producto marcado como inactivo');
      res.status(200).json({ message: 'Producto marcado como inactivo' });
    } catch (error) {
      console.error('Error al marcar el producto como inactivo', error);
      res.status(500).json({ message: 'Error al marcar el producto como inactivo' });
    }
  };

  //obtener metodo pago

  const obtenerMetodoPago = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Metodos_Pago'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener METODOS PAGO:', err);
        res.status(500).send('Error al obtener METODOS PAGO');
    }
};
  

module.exports = {
    obtenerGeneros,
    actualizarStock,
    obtenerTalla,
    obtenerColor,
    reponerStock,
    EliminarProducto,
    restarStock,
    obtenerMetodoPago
};

