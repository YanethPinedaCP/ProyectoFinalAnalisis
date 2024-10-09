const mssql = require ('mssql');
require('dotenv').config();

//Traemos los datos para conexion de base de datos
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    options: {
        encrypt: true, // Si estás en Azure
        trustServerCertificate: true // Si estás en desarrollo local
    }
};

//establecemos la conexion a la base de datos
const poolPromise = new mssql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Conexión exitosa a base de datos');
        return pool;
    })
    .catch(err => console.error('Error de conexión a la base de datos:', err));

module.exports = { poolPromise };