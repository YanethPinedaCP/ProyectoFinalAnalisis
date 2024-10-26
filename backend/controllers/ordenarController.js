// controllers/carritoController.js
const { poolPromise } = require('../config/dbConfig'); // Configuración de base de datos
const sql = require('mssql'); // Asegúrate de tener esta importación
const nodemailer = require('nodemailer');

const getResumenCompra = async (req, res) => {
    const { id_usuario } = req.params; // Obtenemos el id_usuario desde los parámetros
    try {
        const pool = await poolPromise;

        // Consulta para obtener los productos, sus cantidades, tallas, colores y precios
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT carrito.id_carrito, carrito.id_usuario, carrito.id_producto, 
                    carrito.precio, carrito.cantidad, productos.nombre, productos.imagen, 
                    tallas.talla AS talla, colores.color AS color
                FROM Carrito_de_compras carrito
                JOIN Productos productos ON carrito.id_producto = productos.id_producto
                JOIN Tallas tallas ON productos.id_talla = tallas.id_talla
                JOIN Colores colores ON productos.id_color = colores.id_color
                WHERE carrito.id_usuario = @id_usuario
            `);

        if (result.recordset.length === 0) {
            return res.json({ message: 'Tu carrito está vacío' });
        }

        // Calculamos el total de la compra
        const productos = result.recordset;
        let total = 0;
        productos.forEach(producto => {
            total += producto.precio * producto.cantidad;
        });

        res.json({ productos, total });
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).send('Error al obtener productos');
    }
};

const finalizarCompra = async (req, res) => {
  const { carrito, id_usuario, id_metodo_pago, total_compra, comprobante_pago, comentarios } = req.body;

  // Validaciones de datos
  if (!carrito || carrito.length === 0 || !id_usuario || !id_metodo_pago || !total_compra) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
      const pool = await poolPromise;
      const fecha_pedido = new Date(); // Fecha del pedido
      const estado_compra = 1; // Estado inicial de la compra

      // 1. Insertar el pedido en la tabla "Pedidos" y capturar el nuevo id_pedido
      const pedidoResult = await pool.request()
          .input('id_usuario', sql.Int, id_usuario)
          .input('fecha_pedido', sql.DateTime, fecha_pedido)
          .input('id_metodo_pago', sql.Int, id_metodo_pago)
          .input('total_compra', sql.Decimal(8, 2), total_compra)
          .input('comprobante_pago', sql.VarChar, comprobante_pago || null)
          .input('comentarios', sql.VarChar, comentarios || '')
          .input('id_estado_compra', sql.Int, estado_compra)
          .query(`
            INSERT INTO Pedidos (id_usuario, fecha_pedido, id_metodo_pago, id_estado_compra, total_compra, comprobante_pago, comentarios)
            OUTPUT Inserted.id_pedido
            VALUES (@id_usuario, @fecha_pedido, @id_metodo_pago, @id_estado_compra, @total_compra, @comprobante_pago, @comentarios)
          `);

      // Capturar el nuevo id_pedido generado
      const id_pedido = pedidoResult.recordset[0].id_pedido;

      // 2. Insertar los detalles del pedido en la tabla "Detalle_Pedido"
      for (let item of carrito) {
          await pool.request()
              .input('id_pedido', sql.Int, id_pedido) // Aquí usamos el id_pedido recién generado
              .input('id_producto', sql.Int, item.id_producto)
              .input('cantidad', sql.Int, item.cantidad)
              .input('precio_unitario', sql.Decimal(8, 2), item.precio_unitario)
              .input('subtotal', sql.Decimal(8, 2), item.cantidad * item.precio_unitario)
              .query(`
                  INSERT INTO Detalles_Pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                  VALUES (@id_pedido, @id_producto, @cantidad, @precio_unitario, @subtotal)
              `);

          // 3. Actualizar el stock del producto en la tabla "Productos"
          const productoStock = await pool.request()
              .input('id_producto', sql.Int, item.id_producto)
              .query('SELECT stock FROM Productos WHERE id_producto = @id_producto');

          // Verificar si el stock es suficiente y no permitir que sea negativo
          let nuevoStock = productoStock.recordset[0].stock - item.cantidad;
          if (nuevoStock < 0) {
              nuevoStock = 0; // Si el stock es menor a 0, lo ajustamos a 0
          }

          await pool.request()
              .input('id_producto', sql.Int, item.id_producto)
              .input('nuevoStock', sql.Int, nuevoStock)
              .query('UPDATE Productos SET stock = @nuevoStock WHERE id_producto = @id_producto');
      }

      // 4. Eliminar el carrito del usuario
      await pool.request()
          .input('id_usuario', sql.Int, id_usuario)
          .query('DELETE FROM Carrito_de_compras WHERE id_usuario = @id_usuario');

      // Obtener los datos del usuario para enviar el correo
      const userResult = await pool.request()
          .input('id_usuario', sql.Int, id_usuario)
          .query('SELECT nombre, correo FROM Usuarios WHERE id_usuario = @id_usuario');

      const { nombre, correo } = userResult.recordset[0];

      // Crear PDF en memoria
      const { jsPDF } = require('jspdf'); // Asegúrate de tener jsPDF instalada
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Factura de Compra', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`ID Pedido: ${id_pedido}`, 20, 30);
      doc.text(`Usuario: ${nombre}`, 20, 40);
      doc.text(`Método de Pago: ${id_metodo_pago}`, 20, 50);
      doc.text(`Total de Compra: ${total_compra}`, 20, 60);
      doc.text(`Comprobante de Pago: ${comprobante_pago || 'N/A'}`, 20, 70);
      doc.text(`Comentarios: ${comentarios || 'N/A'}`, 20, 80);
      doc.text('Detalles del Carrito:', 20, 90);
      
      carrito.forEach((item, index) => {
          const line = `${item.usuario} - Cantidad: ${item.cantidad} - Precio Unitario: ${item.precio_unitario} - Subtotal: ${item.cantidad * item.precio_unitario}`;
          doc.text(line, 20, 100 + (index * 10)); // Incrementa la posición vertical para cada producto
      });

      // Convertir el PDF a un Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      // Configuración de Nodemailer
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
          subject: 'Compra Realizada en L Ross',
          html: `Hola ${nombre}, Su compra fue realizada con éxito.`,
          attachments: [
              {
                  filename: `factura_${id_pedido}.pdf`,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
              },
          ],
      };

      // Enviar el correo
      await transporter.sendMail(mailOptions);

      // Responder con el id_pedido generado
      res.status(201).json({ message: 'Compra realizada con éxito', id_pedido });
  } catch (error) {
      console.error('Error al crear el pedido:', error);
      res.status(500).json({ message: 'Error al crear el pedido' });
  }
};


      // Nuevo método para obtener la compra
const getCompra = async (req, res) => {
  const { id_pedido } = req.params; // Obtenemos el id_pedido desde los parámetros
  try {
      const pool = await poolPromise;

      // Consulta para obtener el pedido y sus detalles
      const result = await pool.request()
          .input('id_pedido', sql.Int, id_pedido)
          .query(`
              SELECT 
                  p.id_pedido,
                  u.id_usuario,
                  u.nombre,
                  u.apellido,
                  p.fecha_pedido,
                  mp.nombre AS metodo_pago,
                  p.id_estado_compra,
                  p.total_compra,

                  dp.id_detalle_pedido,
                  dp.id_producto,
                  dp.cantidad,
                  dp.precio_unitario,
                  dp.subtotal
              FROM 
                  Pedidos p
              JOIN 
                  Detalles_Pedidos dp ON p.id_pedido = dp.id_pedido
              JOIN 
                  Usuarios u ON p.id_usuario = u.id_usuario
              JOIN 
                  Metodos_Pago mp ON p.id_metodo_pago = mp.id_metodo_pago
              WHERE 
                  p.id_pedido = @id_pedido
          `);

      if (result.recordset.length === 0) {
          return res.status(404).json({ message: 'Pedido no encontrado' });
      }

      // Procesar los resultados
      const compra = result.recordset;
      const datosCompra = {
          id_pedido: compra[0].id_pedido,
          usuario: {
              id_usuario: compra[0].id_usuario,
              nombre: compra[0].nombre,
              apellido: compra[0].apellido
          },
          metodo_pago: compra[0].metodo_pago,
          total_compra: compra[0].total_compra,
          carrito: compra.map(producto => ({
              id_producto: producto.id_producto,
              cantidad: producto.cantidad,
              precio_unitario: producto.precio_unitario,
              subtotal: producto.subtotal,
              nombre: producto.nombre // Asegúrate de que este campo esté en la tabla de productos
          }))
      };

      res.json(datosCompra);
  } catch (err) {
      console.error('Error al obtener los datos de la compra:', err);
      res.status(500).send('Error al obtener los datos de la compra');
  }
};
      
module.exports = {
    getResumenCompra,
    finalizarCompra,
    getCompra
};
