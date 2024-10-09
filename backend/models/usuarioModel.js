// models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = new Sequelize('db_leross', 'sa', 'Admin123', {
    host: 'localhost',
    dialect: 'mssql', // Cambia esto según tu base de datos
});

const Usuarios = sequelize.define('Usuarios', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    contraseña: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    direccion: {
        type: DataTypes.STRING,
    },
    telefono: {
        type: DataTypes.INTEGER,
    },
    id_rol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2, // Asignar 2 por defecto (usuario)
    },
});

module.exports = Usuarios;
