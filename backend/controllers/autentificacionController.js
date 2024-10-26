const { poolPromise } = require('../config/dbConfig');
const mssql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Función login
const login = async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('correo', mssql.NVarChar, correo)
            .query('SELECT id_usuario, nombre, apellido, correo, contraseña, id_rol, isVerified FROM Usuarios WHERE correo = @correo');

        // Verificar si el usuario existe
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.recordset[0];
        console.log('Usuario encontrado:', usuario); // Para depuración

        // Verificar si el usuario está verificado
        console.log('isVerified:', usuario.isVerified); // Para depuración
        if (!usuario.isVerified) { // Verifica si isVerified es 0 (falso)
            return res.status(401).json({ error: 'Usuario no verificado. Por favor, verifica tu correo.' });
        }

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
            return res.status(400).json({ msg: 'El correo ya existe, por favor ingresa un correo válido' });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const encriptada = await bcrypt.hash(contraseña, salt);

        const id_rol = 2;  
        const codigoVerificacion = jwt.sign({ correo }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Insertar nuevo usuario en la base de datos
        await pool.request()
            .input('nombre', mssql.VarChar, nombre)
            .input('apellido', mssql.VarChar, apellido)
            .input('correo', mssql.VarChar, correo)
            .input('contraseña', mssql.VarChar, encriptada)
            .input('direccion', mssql.VarChar, direccion)
            .input('telefono', mssql.Int, telefono)
            .input('id_rol', mssql.Int, id_rol)
            .input('isVerified', mssql.Bit, false)
            .input('codigo_verificacion', mssql.VarChar, codigoVerificacion)
            .query(`INSERT INTO Usuarios (nombre, apellido, correo, contraseña, direccion, telefono, id_rol, isVerified, codigo_verificacion) 
                    VALUES (@nombre, @apellido, @correo, @contraseña, @direccion, @telefono, @id_rol, @isVerified, @codigo_verificacion)`);

        // Crear el enlace de verificación
        const enlaceVerificacion = `http://localhost:3000/verificar-correo?codigoVerificacion=${codigoVerificacion}`;

        // Envío de correo de confirmación
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Confirmación de Registro LROSS',
            html: `Hola ${nombre} ${apellido}, gracias por registrarte en L'Ross Boutique!<br> Por favor, verifica tu correo electrónico.<br> 
                   Presiona el link para verificarte: <a href="${enlaceVerificacion}">Verificar mi cuenta</a>`
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        // Responder con mensaje de éxito
        res.status(201).json({ msg: 'Registro exitoso. Por favor, verifica tu correo.' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).send('Error en el servidor');
    }
};


const verificarEnlace = async (req, res) => {
    const { codigoVerificacion } = req.query; 
    try {
        const pool = await poolPromise;

        // Verificar y decodificar el token
        const decodificado = jwt.verify(codigoVerificacion, process.env.JWT_SECRET);
        const correo = decodificado.correo;

        // Verificar si el correo existe
        const result = await pool.request()
            .input('correo', mssql.VarChar, correo)
            .query('SELECT COUNT(*) AS count FROM Usuarios WHERE correo = @correo');

        if (result.recordset[0].count === 0) {
            return res.status(404).json({ error: 'El correo no existe.' });
        }

        // Actualizar el estado de verificación a 1 (true)
        await pool.request()
            .input('correo', mssql.VarChar, correo)
            .query('UPDATE Usuarios SET isVerified = 1 WHERE correo = @correo');

        // Respuesta exitosa
        return res.status(200).json({ message: 'El correo ha sido verificado correctamente.' });
    } catch (error) {
        console.error('Error en la verificación del enlace:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ error: 'Token inválido.' });
        }
        return res.status(500).json({ error: 'Error en la verificación del enlace.' });
    }
};




const reenviarVerificacion = async (req, res) => {
    const { correo } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('correo', mssql.VarChar, correo)
            .query('SELECT * FROM Usuarios WHERE correo = @correo AND isVerified = 0');

        if (result.recordset.length === 0) {
            return res.status(400).json({ msg: 'Este correo no está registrado o ya ha sido verificado.' });
        }

        const usuario = result.recordset[0]; // Ahora es seguro acceder a este registro

        const codigoVerificacion = jwt.sign({ correo }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Actualizar el token de verificación en la base de datos
        await pool.request()
            .input('correo', mssql.VarChar, correo)
            .input('token_verificacion', mssql.VarChar, codigoVerificacion)
            .query('UPDATE Usuarios SET codigo_verificacion = @token_verificacion WHERE correo = @correo');

        // Crear el enlace de verificación
        const enlaceVerificacion = `http://localhost:5000/verify?token=${codigoVerificacion}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Reenvío de Confirmación de Registro LROSS',
            html: `Hola, aquí tienes el enlace para verificar tu correo electrónico: <a href="${enlaceVerificacion}">${enlaceVerificacion}</a>`
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        res.status(200).json({ msg: 'Correo de verificación reenviado exitosamente.' });
    } catch (error) {
        console.error('Error al reenviar el correo de verificación:', error);
        res.status(500).send('Error al reenviar el correo de verificación');
    }
};

const recuperarContraseña = async (req, res) => {
    const {correo} = req.body;

    try {

    const pool = await poolPromise;

    const result = await pool.request()
    .input('correo', mssql.VarChar, correo)
    .query('SELECT * FROM Usuarios WHERE correo = @correo');

    if(result.recordset.length===0){
        return res.status(404).json({msq: 'Este correo no est[a registrado'});

    }

    const usuario = result.recordset[0];

    // Genera un código de recuperación único
    const codigoRecuperacion = jwt.sign(
        { correo: usuario.correo, timestamp: Date.now() }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );

    await pool.request()
    .input('correo', mssql.VarChar, usuario.correo)
    .input('codigo_recuperacion', mssql.VarChar, codigoRecuperacion)
    .query('UPDATE Usuarios SET codigo_recuperacion = @codigo_recuperacion WHERE correo = @correo');

    const enlaceRestablecer = `http://localhost:3000/cambiar-contrasena?token=${codigoRecuperacion}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: correo,
        subject: 'Recuperación de contraseña - LROSS',
        html: `Hola, ${usuario.nombre}, has solicitado restablecer tu contraseña.<br> 
               Haz clic en el siguiente enlace para crear una nueva contraseña: 
               <a href="${enlaceRestablecer}">Restablecer contraseña</a>`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: 'Se ha enviado un correo para restablecer tu contraseña.' });
    } catch (error) {
        console.error('Error en la recuperación de contraseña:', error);
        res.status(500).send('Error en la recuperación de contraseña');
    }
}

const verificarTokenRecuperacion = async (req, res) => {
    const { token } = req.params;
    console.log('Token recibido:', token); // Verifica que el token sea el correcto

    try {
        // Verificar si el token es válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded); 

        const correo = decoded.correo;
        console.log('correo decodificado', correo);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('correo', mssql.VarChar, correo)
            .input('codigo_recuperacion', mssql.VarChar, token) // Comparando el token directamente
            .query('SELECT * FROM Usuarios WHERE correo = @correo AND codigo_recuperacion = @codigo_recuperacion');

        if (result.recordset.length === 0) {
            return res.status(400).json({ error: 'Token de recuperación inválido o expirado.' });
        }

        res.status(200).json({ 
            message: 'Token válido.', 
            correo: correo 
        });
    } catch (error) {
        console.error('Error al verificar el token:', error.message);
        res.status(400).json({ error: 'Token de recuperación inválido o expirado.' });
    }
};


const restablecerContraseña = async (req, res) => {
    const { correo, codigo_recuperacion, nuevaContraseña } = req.body;

    try {
        const pool = await poolPromise;

        // Verificar que el token de recuperación sea válido
        const result = await pool.request()
            .input('correo', mssql.VarChar, correo)
            .input('codigo_recuperacion', mssql.VarChar, codigo_recuperacion)
            .query('SELECT * FROM Usuarios WHERE correo = @correo AND codigo_recuperacion = @codigo_recuperacion');

        if (result.recordset.length === 0) {
            return res.status(400).json({ error: 'Token de recuperación inválido o expirado.' });
        }

        // Si el token es válido, encriptar la nueva contraseña
        const saltRounds = 10;
        const contraseñaEncriptada = await bcrypt.hash(nuevaContraseña, saltRounds);

        // Actualizar la contraseña y limpiar el token de recuperación
        await pool.request()
            .input('correo', mssql.VarChar, correo)
            .input('nuevaContraseña', mssql.VarChar, contraseñaEncriptada)
            .query('UPDATE Usuarios SET contraseña = @nuevaContraseña, codigo_recuperacion = NULL WHERE correo = @correo');

        res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ error: 'Error del servidor al restablecer la contraseña.' });
    }
};


module.exports = { login, registro, verificarEnlace, 
    reenviarVerificacion, recuperarContraseña, restablecerContraseña,verificarTokenRecuperacion };