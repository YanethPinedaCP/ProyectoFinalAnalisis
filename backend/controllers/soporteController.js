const { poolPromise } = require('../config/dbConfig'); // Importa tu configuración de base de datos
const sql = require('mssql'); // Asegúrate de tener esta importación
const nodemailer = require('nodemailer'); // Asegúrate de instalar nodemailer para enviar correos


const getTiposSoporte = async (req, res) => {
    try {
        const pool = await poolPromise; // Asegúrate de que poolPromise esté configurado correctamente
        const result = await pool.request().query(`
            SELECT id_tipo_soporte, tipo_soporte
            FROM Tipo_Soporte
        `);
        res.json(result.recordset); // Envía los tipos de soporte como respuesta
    } catch (err) {
        console.error('Error en obtener tipos de soporte:', err);
        res.status(500).send('Error en obtener tipos de soporte');
    }
};

const enviarSoporte = async (req, res) => {
    const {id_usuario, id_tipo_soporte, descripcion} = req.body;

    if (!id_usuario || !id_tipo_soporte || !descripcion) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    } 

    try {
        const pool = await poolPromise;
        const fecha_solicitud = new Date(); // Fecha del reporte
        const id_estado = 1; // Estado inicial del soporte 

        // Insertar en la tabla Soporte y obtener el id generado
        const soporteResult = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_tipo_soporte', sql.Int, id_tipo_soporte)
            .input('descripcion', sql.VarChar, descripcion)
            .input('fecha_solicitud', sql.DateTime, fecha_solicitud)
            .input('id_estado', sql.Int, id_estado)
            .query(`
                INSERT INTO Soporte (id_usuario, id_tipo_soporte, descripcion, fecha_solicitud, id_estado)
                OUTPUT Inserted.id_soporte
                VALUES (@id_usuario, @id_tipo_soporte, @descripcion, @fecha_solicitud, @id_estado)
            `);

        // Obtener el id del soporte insertado
        const id_soporte = soporteResult.recordset[0].id_soporte;

        res.status(201).json({ message: 'Reporte de soporte creado exitosamente', id_soporte });
    } catch (error) {
        console.error('Error al crear el reporte de soporte:', error);
        res.status(500).json({ message: 'Error en el servidor al crear el reporte de soporte' });
    }
};


// Configura nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Obtener todos los reportes de soporte
const getReportesSoporte = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                s.id_soporte, 
                s.id_usuario, 
                u.correo, 
                u.nombre,  -- Agregamos el nombre del usuario
                s.id_tipo_soporte, 
                t.tipo_soporte, 
                s.descripcion, 
                s.fecha_solicitud, 
                s.id_estado, 
                s.respuesta, 
                s.fecha_respuesta
            FROM Soporte s
            JOIN Usuarios u ON s.id_usuario = u.id_usuario
            JOIN Tipo_Soporte t ON s.id_tipo_soporte = t.id_tipo_soporte
            WHERE s.id_estado = 1  -- Filtrar solo los reportes con estado 1
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener reportes de soporte:', error);
        res.status(500).send('Error al obtener reportes de soporte');
    }
};



// Actualizar reporte de soporte y enviar correo
const actualizarSoporte = async (req, res) => {
    const { id_soporte, id_estado, respuesta, fecha_respuesta } = req.body;

    if (!id_soporte || !id_estado || !respuesta || !fecha_respuesta) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const pool = await poolPromise;

        // Actualizar el soporte
        await pool.request()
            .input('id_soporte', sql.Int, id_soporte)
            .input('id_estado', sql.Int, id_estado)
            .input('respuesta', sql.VarChar, respuesta)
            .input('fecha_respuesta', sql.DateTime, fecha_respuesta)
            .query(`
                UPDATE Soporte
                SET id_estado = @id_estado, respuesta = @respuesta, fecha_respuesta = @fecha_respuesta
                WHERE id_soporte = @id_soporte
            `);

        // Obtener el correo del usuario
        const result = await pool.request()
            .input('id_soporte', sql.Int, id_soporte)
            .query(`
                SELECT u.correo, s.descripcion
                FROM Soporte s
                JOIN Usuarios u ON s.id_usuario = u.id_usuario
                WHERE s.id_soporte = @id_soporte
            `);
        
        const { correo, descripcion } = result.recordset[0];

        // Enviar notificación por correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Actualización de soporte',
            text: `Hola, tu reporte de soporte con descripción "${descripcion}" ha sido actualizado con la siguiente respuesta: ${respuesta},
            En breve solucionaremos tu probelma o nos pondremos en contacto contigo. GRACIAS POR PREFERIRNOS`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Reporte actualizado y correo enviado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar soporte:', error);
        res.status(500).json({ message: 'Error al actualizar soporte' });
    }
};

module.exports = {
    getTiposSoporte,
    enviarSoporte,
    getReportesSoporte,
    actualizarSoporte,
    getTiposSoporte,
    enviarSoporte
};
