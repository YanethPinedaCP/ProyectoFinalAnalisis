const { poolPromise } = require('../config/dbConfig'); // Importa tu configuración de base de datos
const sql = require('mssql'); // Asegúrate de tener esta importación

//Ver todos los productos
const getProductos = async (req, res) => {
    try {
        const pool = await poolPromise; // Espera la conexión a la base de datos
        const result = await pool.request().query('SELECT * FROM Productos'); 
        res.json(result.recordset); // Envía los productos como respuesta
    } catch (err) {
        console.error('Error en obtener productos:', err);
        res.status(500).send('Error en obtener productos');
    }
};

//Agregar un producto
const agregarProducto = async (req, res) => {
    const { nombre, descripcion, precio, imagen, id_categoria } = req.body;
  
    // Verifica que todos los campos requeridos estén presentes
    if (!nombre || !descripcion || !precio || !imagen || !id_categoria) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
  
    try {
      const pool = await poolPromise; // Espera la conexión a la base de datos
      const fecha_registro = new Date(); // Crear la fecha de registro
  
      // Consulta SQL para insertar el nuevo producto
      const query = `
        INSERT INTO Productos (nombre, descripcion, precio, imagen, id_categoria, fecha_registro)
        VALUES (@nombre, @descripcion, @precio, @imagen, @id_categoria, @fecha_registro)
      `;
  
      // Ejecutar la consulta con los parámetros
      await pool.request()
        .input('nombre', sql.VarChar, nombre)
        .input('descripcion', sql.VarChar, descripcion)
        .input('precio', sql.Decimal(8, 2), precio)
        .input('imagen', sql.VarChar, imagen)
        .input('id_categoria', sql.Int, id_categoria)
        .input('fecha_registro', sql.DateTime, fecha_registro)
        .query(query); // Ejecutar la consulta
  
      // Responder con éxito
      res.status(201).json({ message: 'Producto agregado exitosamente' });
    } catch (error) {
      console.error('Error agregando el producto', error);
      res.status(500).json({ message: 'Error al agregar el producto' });
    }
};

module.exports = {
    getProductos,
    agregarProducto
};
