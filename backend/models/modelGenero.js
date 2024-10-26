// models/Genero.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig'); // Ajusta la ruta según tu configuración

const Genero = sequelize.define('Genero', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  }
});

module.exports = Genero;
