const { poolPromise } = require('../config/dbConfig'); // Importa tu configuración de base de datos
const sql = require('mssql'); // Asegúrate de tener esta importación

//Ver todos los productos
const getProductos = async (req, res) => {
    try {
        const pool = await poolPromise; // Espera la conexión a la base de datos
        const result = await pool.request().query('SELECT * FROM Productos WHERE id_estado = 1'); 
        res.json(result.recordset); // Envía los productos como respuesta
    } catch (err) {
        console.error('Error en obtener productos:', err);
        res.status(500).send('Error en obtener productos');
    }
};

//Agregar un producto
const agregarProducto = async (req, res) => {
  const {nombre, descripcion, precio, imagen, id_categoria, stock, id_genero, id_talla, id_color } = req.body;
  
    // Verifica que todos los campos requeridos estén presentes
    if (!nombre || !descripcion || !precio || !imagen || !id_categoria || !stock || !id_genero || !id_talla || !id_color ) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }
  
    try {
      const pool = await poolPromise; // Espera la conexión a la base de datos
      const fecha_registro = new Date(); // Crear la fecha de registro
  
      // Consulta SQL para insertar el nuevo producto
      const query = `
        INSERT INTO Productos (nombre, descripcion, precio, imagen, id_categoria, fecha_registro, stock, id_genero, id_talla, id_color)
        VALUES (@nombre, @descripcion, @precio, @imagen, @id_categoria, @fecha_registro, @stock, @id_genero, @id_talla, @id_color)
      `;
  
      // Ejecutar la consulta con los parámetros
      await pool.request()
        .input('nombre', sql.VarChar, nombre)
        .input('descripcion', sql.VarChar, descripcion)
        .input('precio', sql.Decimal(8, 2), precio)
        .input('imagen', sql.VarChar, imagen)
        .input('id_categoria', sql.Int, id_categoria)
        .input('fecha_registro', sql.DateTime, fecha_registro)
        .input('stock', sql.Int, stock)
        .input('id_genero', sql.Int, id_genero)
        .input('id_talla', sql.Int, id_talla)
        .input('id_color', sql.Int, id_color)
        .query(query); // Ejecutar la consulta
  
      // Responder con éxito
      res.status(201).json({ message: 'Producto agregado exitosamente' });
    } catch (error) {
      console.error('Error agregando el producto', error);
      res.status(500).json({ message: 'Error al agregar el producto' });
    }
};

const actualizarProducto = async (req, res) => {
  const {id_producto} = req.params;
  const {nombre, descripcion, precio, imagen, id_categoria, stock, id_genero, id_talla, id_color } = req.body;

  // Verifica que todos los campos requeridos estén presentes
  if (!nombre || !descripcion || !precio || !imagen || !id_categoria || !stock || !id_genero || !id_talla || !id_color ) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
}


  try {
    const pool = await poolPromise;

    const query = `UPDATE Productos 
SET nombre = @nombre, descripcion = @descripcion, precio = @precio, imagen = @imagen, id_categoria = @id_categoria,
stock = @stock, id_genero = @id_genero, id_talla = @id_talla, id_color = @id_color, updated_at = GETDATE()
WHERE id_producto = @id_producto`;


    await pool.request()
    .input('id_producto', sql.Int, id_producto) // Parámetro del ID del producto
    .input('nombre', sql.VarChar, nombre)
    .input('descripcion', sql.VarChar, descripcion)
    .input('precio', sql.Decimal(8, 2), precio)
    .input('imagen', sql.VarChar, imagen)
    .input('id_categoria', sql.Int, id_categoria)
    .input('stock', sql.Int, stock)
    .input('id_genero', sql.Int, id_genero)
    .input('id_talla', sql.Int, id_talla)
    .input('id_color', sql.Int, id_color)
    .query(query); // Ejecutar la consulta

    res.status(200).json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
    console.error('Error actualizando el producto', error);
    res.status(500).json({ message: 'Error al actualizar el producto' });
    }

};

//eliminar producto (se cambiara de estado para que no se elimine completamente de la bdd)
const EliminarProducto = async (req, res) => {
  const {id_producto} = req.params;

  try {
    const pool = await poolPromise;

    const query = `UPDATE Productos 
    SET id_estado = 2 WHERE id_producto = @id_producto`;
  
    await pool.request()
    .input('id_producto' , sql.Int, id_producto)
    .query(query);

    console.log('Producto marcado como inactivo ');
    res.status(200).json({message: 'Producto marcado como inactivo'});

  } catch (error) { 
    console.error('Error al marcar el prodcuto como inacvito', error);
    res.status(500).json({ message: 'Error al marcar el producto como inactivo' });
  }

};

const lomasnuevo = async (req, res) => {

  try {
    const pool = await poolPromise;

    const result = await pool.request().query('SELECT TOP 5 * FROM Productos WHERE id_estado = 1 ORDER BY fecha_registro DESC');
    res.json(result.recordset);
    
  } catch (error) {
    console.log('Error al obtener productos nuevos: ', error);
    res.status(500).send('Error al obtener productos'); 
  }

};

//EN TENDENCIA API (ARREGLAR PARA CUANDO EMPIECEN VENTAS)


const enTendencia = async (req, res) => {

  try {
    const pool = await poolPromise;

    const result = await pool.request().query('SELECT TOP 5 * FROM Productos WHERE id_estado = 2 ORDER BY fecha_registro DESC');
    res.json(result.recordset);
    
  } catch (error) {
    console.log('Error al obtener productos nuevos: ', error);
    res.status(500).send('Error al obtener productos'); 
  }

};


module.exports = {
    getProductos,
    agregarProducto,
    actualizarProducto,
    EliminarProducto,
    lomasnuevo,
    enTendencia
};
