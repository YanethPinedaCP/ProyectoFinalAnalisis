// controllers/inventoryController.js

const { poolPromise } = require('../config/dbConfig'); // Importa tu configuración de base de datos
const sql = require('mssql'); // Importa el módulo SQL

// Obtener todos los productos activos como inventario
const getProductosInv = async (req, res) => {
    try {
        const pool = await poolPromise; // Espera la conexión a la base de datos
        const query = `
            SELECT 
                id_producto,nombre,descripcion,precio,imagen,id_categoria,fecha_registro,id_estado,stock,id_genero,id_talla,id_color,updated_at
            FROM 
                Productos
            WHERE 
                id_estado = 1 -- Solo productos activos
        `;

        const result = await pool.request().query(query); // Ejecuta la consulta
        res.json(result.recordset); // Envía el conjunto de resultados como respuesta JSON
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
};

const getProductomenosStock = async (req, res) => {
    try {
        const pool = await poolPromise;
        const stockThreshold = 5; // Define el umbral de stock bajo

        // Consulta a la base de datos para obtener productos con stock menor al umbral
        const result = await pool.request()
            .input('stockThreshold', stockThreshold)
            .query(`
                SELECT id_producto, nombre, descripcion, precio, stock, id_categoria,fecha_registro, updated_at
                FROM Productos
                WHERE stock < @stockThreshold
            `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al obtener productos con menos stock:', error);
        res.status(500).json({ message: 'Error al obtener productos con menos stock' });
    }
};

// API para obtener productos agotados
const getProductosAgotados = async (req, res) => {
    try {
        const pool = await poolPromise;
        const query = `SELECT * FROM productos WHERE stock = 0`;
        const result = await pool.request().query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No hay productos agotados." });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error al obtener productos agotados:", error);
        res.status(500).json({ message: "Error al obtener productos agotados." });
    }
};

const getProductosInac = async (req, res) => {
    try {
        const pool = await poolPromise; // Espera la conexión a la base de datos
        const query = `
            SELECT 
                id_producto,nombre,descripcion,precio,imagen,id_categoria,fecha_registro,id_estado,stock,id_genero,id_talla,id_color,updated_at
            FROM 
                Productos
            WHERE 
                id_estado = 2 
        `;

        const result = await pool.request().query(query); // Ejecuta la consulta
        res.json(result.recordset); // Envía el conjunto de resultados como respuesta JSON
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
};

const getProductosPorCategoria = async (req, res) => {
    try {
        const pool = await poolPromise; // Espera la conexión a la base de datos
        const { id_categoria } = req.params; // Obtiene el id_categoria de los parámetros de la URL

        const query = `
            SELECT 
                id_producto, nombre, descripcion, precio, imagen, id_categoria, fecha_registro, id_estado, stock, id_genero, id_talla, id_color, updated_at
            FROM 
                Productos
            WHERE 
                id_categoria = @id_categoria AND id_estado = 1 -- Solo productos activos
        `;

        const result = await pool.request()
            .input('id_categoria', sql.Int, id_categoria) // Parámetro de la categoría
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No hay productos en esta categoría." });
        }

        res.status(200).json(result.recordset); // Envía los productos de la categoría como JSON
    } catch (err) {
        console.error('Error al obtener productos por categoría:', err);
        res.status(500).send('Error al obtener productos por categoría');
    }
};

module.exports = {
    getProductosInv,
    getProductomenosStock,
    getProductosAgotados,
    getProductosInac,
    getProductosPorCategoria
};
