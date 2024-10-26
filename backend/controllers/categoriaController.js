// Importar dependencias
const { poolPromise } = require('../config/dbConfig');
const sql = require('mssql');

// Obtener todas las categorías
const getCategorias = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Categorias'); 
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).send('Error al obtener categorías');
    }
};

module.exports = {
    getCategorias
};
