const { poolPromise } = require('../config/dbConfig');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const getUsuariosAdmin = async (req, res) => {
    try {
        const pool = await poolPromise; 
        const result = await pool.request().query('SELECT id_usuario, nombre, apellido, correo, direccion, telefono, id_rol FROM Usuarios WHERE id_rol = 1 AND isVerified = 1'); 
        res.json(result.recordset); 
    } catch (err) {
        console.error('Error al obtener usuarios ADMIN:', err);
        res.status(500).send('Error al obtener administradores');
    }
};

// Función para generar un token aleatorio de 8 caracteres
const generarToken = (length = 8) => {
    return require('crypto').randomBytes(length).toString('hex').slice(0, length);
};

const registroAdmin = async (req, res) => {
    const { nombre, apellido, correo, direccion, telefono } = req.body;
    try {
        const pool = await poolPromise;

        // Verificar si el correo ya está registrado
        const verificacionCorreo = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM Usuarios WHERE correo = @correo');
        
        if (verificacionCorreo.recordset.length > 0) {
            return res.status(400).json({ msg: 'El correo ya existe, por favor ingresa un correo válido' });
        }

        // Generar un token de verificación de 8 caracteres
        const tokenContraseña = generarToken(); // Llamar a la función para generar el token

        // Encriptar el token antes de guardarlo
        const tokenEncriptado = await bcrypt.hash(tokenContraseña, 10);

        const id_rol = 1; // Asignar el rol de administrador (1)

        // Insertar nuevo administrador en la base de datos
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('correo', sql.VarChar, correo)
            .input('contraseña', sql.VarChar, tokenEncriptado) // Usar el token encriptado como contraseña
            .input('direccion', sql.VarChar, direccion)
            .input('telefono', sql.Int, telefono)
            .input('id_rol', sql.Int, id_rol) // Se asegura que siempre sea 1
            .input('isVerified', sql.Bit, true) // Marcar como verificado
            .query(`INSERT INTO Usuarios (nombre, apellido, correo, contraseña, direccion, telefono, id_rol, isVerified) 
                    VALUES (@nombre, @apellido, @correo, @contraseña, @direccion, @telefono, @id_rol, @isVerified)`);

        // Crear el mensaje del correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Registro de Administrador en LROSS',
            html: `Hola ${nombre} ${apellido}, gracias por registrarte como administrador en L'Ross Boutique!<br> 
                   Tu contraseña temporal es: <strong>${tokenContraseña}</strong><br> 
                   Por favor, utiliza este token para iniciar sesión y cambiar tu contraseña desde tu perfil.`
        };

        // Envío de correo de confirmación
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        // Responder con mensaje de éxito
        res.status(201).json({ msg: 'Registro de administrador exitoso. Revisa tu correo para la contraseña temporal.' });
    } catch (error) {
        console.error('Error en el registro de administrador:', error);
        res.status(500).send('Error en el servidor');
    }
};

// Función para obtener usuarios clientes
const getUsuariosClientes = async (req, res) => {
    try {
        const pool = await poolPromise; 
        const result = await pool.request().query('SELECT id_usuario, nombre, apellido, correo, direccion, telefono, id_rol FROM Usuarios WHERE id_rol = 2'); 
        res.json(result.recordset); 
    } catch (err) {
        console.error('Error al obtener usuarios CLIENTES:', err);
        res.status(500).send('Error al obtener clientes');
    }
};

const actualizarAdmin = async (req, res) => {
    const { id_usuario, nombre, apellido, correo, direccion, telefono } = req.body;

    try {
        const pool = await poolPromise;

        // Verificar si el administrador existe
        const adminExistente = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT * FROM Usuarios WHERE id_usuario = @id_usuario AND id_rol = 1');

        if (adminExistente.recordset.length === 0) {
            return res.status(404).json({ msg: 'Administrador no encontrado' });
        }

        // Verificar si el correo ya está registrado por otro administrador
        const verificacionCorreo = await pool.request()
            .input('correo', sql.VarChar, correo)
            .input('id_usuario', sql.Int, id_usuario) // Para asegurarse de que se excluye el administrador actual
            .query('SELECT * FROM Usuarios WHERE correo = @correo AND id_usuario != @id_usuario');

        if (verificacionCorreo.recordset.length > 0) {
            return res.status(400).json({ msg: 'El correo ya está en uso por otro administrador' });
        }

        // Actualizar el administrador en la base de datos
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('correo', sql.VarChar, correo)
            .input('direccion', sql.VarChar, direccion)
            .input('telefono', sql.Int, telefono)
            .query(`UPDATE Usuarios 
                    SET nombre = @nombre, apellido = @apellido, correo = @correo, 
                        direccion = @direccion, telefono = @telefono 
                    WHERE id_usuario = @id_usuario`);

        // Responder con mensaje de éxito
        res.json({ msg: 'Administrador actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el administrador:', error);
        res.status(500).send('Error en el servidor');
    }
};

module.exports = {
    getUsuariosAdmin,
    registroAdmin,
    getUsuariosClientes,
    actualizarAdmin
};
