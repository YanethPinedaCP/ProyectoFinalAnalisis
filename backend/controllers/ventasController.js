const { poolPromise } = require('../config/dbConfig'); // Importa tu configuración de base de datos
const sql = require('mssql'); // Asegúrate de tener esta importación

//Ver todos los productos
const getventaspendientes = async (req, res) => {
    try {
        const pool = await poolPromise; 
        const result = await pool.request().query(`
   SELECT P.id_pedido, P.id_usuario, P.fecha_pedido,MP.nombre AS metodo_pago, P.total_compra,
                P.comprobante_pago,
                EC.estado
            FROM 
                Pedidos P
            JOIN 
                Estado_Compra EC ON P.id_estado_compra = EC.id_estado_compra  
            JOIN 
                Metodos_Pago MP ON P.id_metodo_pago = MP.id_metodo_pago
            WHERE 
                P.id_pedido = P.id_pedido AND EC.id_estado_compra = '1'
            `);
        res.json(result.recordset); // Envía los pedidos pendientes como respuesta
    } catch (err) {
        console.error('Error en obtener pedidos pendientes:', err);
        res.status(500).send('Error en obtener pedidos pendientes');
    }
};

const confirmarcompra = async (req, res) => {
    const { id_pedido } = req.body;

    try {
        const pool = await poolPromise;

        // 1. Actualizar el estado de la compra en la tabla Pedidos
        await pool.request()
            .input('id_pedido', sql.Int, id_pedido)
            .query(`
                UPDATE Pedidos
                SET id_estado_compra = '2' -- Cambia el estado a confirmado
                WHERE id_pedido = @id_pedido
            `);

        // 2. Insertar en la tabla Ventas sin el campo comprobante_pago
        await pool.request()
            .input('id_pedido', sql.Int, id_pedido)
            .query(`
                INSERT INTO Ventas (id_pedido, fecha_venta, total_venta, id_metodo_pago, estado)
                SELECT P.id_pedido, P.fecha_pedido, P.total_compra, P.id_metodo_pago, 'Confirmado'
                FROM Pedidos P
                WHERE P.id_pedido = @id_pedido
            `);

        res.status(200).json({ message: 'Venta confirmada y registrada con éxito.' });
    } catch (err) {
        console.error('Error al confirmar la venta:', err);
        res.status(500).send('Error al confirmar la venta');
    }
};

const getVentas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                V.id_venta,
                V.id_pedido,
                V.fecha_venta,
                V.total_venta,
                MP.nombre AS metodo_pago,
                V.estado
            FROM 
                Ventas V
            JOIN 
                Metodos_Pago MP ON V.id_metodo_pago = MP.id_metodo_pago
            WHERE 
                V.estado = 'Confirmado'
        `);
        res.json(result.recordset); // Envía las ventas confirmadas como respuesta
    } catch (err) {
        console.error('Error al obtener las ventas confirmadas:', err);
        res.status(500).send('Error al obtener las ventas confirmadas');
    }
};

module.exports = {
    getventaspendientes,
    confirmarcompra,
    getVentas
};
