const { poolPromise } = require('../config/dbConfig'); // Importa tu configuración de base de datos
const sql = require('mssql'); // Asegúrate de tener esta importación

// Obtener los datos del usuario necesarios para la compra
const getUsuarios = async (req, res) => {
    const { id_usuario } = req.params; // Tomamos el id_usuario de los parámetros de la solicitud
    try {
        const pool = await poolPromise; // Espera la conexión a la base de datos
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario) // Pasamos el id_usuario como parámetro
            .query('SELECT id_usuario, nombre, apellido, correo, direccion, telefono FROM Usuarios WHERE id_usuario = @id_usuario'); // Consulta con parámetro
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(result.recordset[0]); // Envía el usuario encontrado como respuesta
    } catch (err) {
        console.error('Error en obtener el usuario:', err);
        res.status(500).send('Error en obtener el usuario');
    }
};


module.exports = {
    getUsuarios,
};

