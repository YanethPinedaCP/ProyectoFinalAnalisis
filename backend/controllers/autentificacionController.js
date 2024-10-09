const { poolPromise } = require('../config/dbConfig');
const mssql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función login
const login = async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('correo', mssql.NVarChar, correo)
            .query('SELECT id_usuario, nombre, apellido, correo, contraseña, id_rol FROM Usuarios WHERE correo = @correo');

        // Verificar si el usuario existe
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.recordset[0];
        console.log('Usuario encontrado:', usuario); // Para depuración

        // Comparar la contraseña ingresada con la contraseña hasheada almacenada
        const esContraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!esContraseñaValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Generar token JWT
        const payload = {
            user: {
                id_usuario: usuario.id_usuario,
                id_rol: usuario.id_rol,
                nombre: usuario.nombre
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Responder con éxito y token
        res.json({ message: 'Inicio de sesión exitoso', token, rol: usuario.id_rol });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

// Función registro
const registro = async (req, res) => {
    const { nombre, apellido, correo, contraseña, direccion, telefono } = req.body;
    try {
        const pool = await poolPromise;

        // Verificar si el correo ya está registrado
        const verificacionCorreo = await pool.request()
            .input('correo', mssql.VarChar, correo)
            .query('SELECT * FROM Usuarios WHERE correo = @correo');
        
        if (verificacionCorreo.recordset.length > 0) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const encriptada = await bcrypt.hash(contraseña, salt);

        const id_rol = 2;  
        
        // Insertar nuevo usuario en la base de datos
        await pool.request()
            .input('nombre', mssql.VarChar, nombre)
            .input('apellido', mssql.VarChar, apellido)
            .input('correo', mssql.VarChar, correo)
            .input('contraseña', mssql.VarChar, encriptada)  // Contraseña hasheada
            .input('direccion', mssql.VarChar, direccion)
            .input('telefono', mssql.Int, telefono)
            .input('id_rol', mssql.Int, id_rol)
            .query(`INSERT INTO Usuarios (nombre, apellido, correo, contraseña, direccion, telefono, id_rol) 
                    VALUES (@nombre, @apellido, @correo, @contraseña, @direccion, @telefono, @id_rol)`);

        // Generar token JWT
        const payload = {
            user: {
                correo,
                id_rol,
                nombre
            }
        };

        // Verificar que la clave secreta está definida
        if (!process.env.JWT_SECRET) {
            throw new Error('La clave secreta para JWT no está definida en el archivo .env');
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Responder con el token
        res.status(201).json({ token });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).send('Error en el servidor');
    }
};


module.exports = { login, registro };
