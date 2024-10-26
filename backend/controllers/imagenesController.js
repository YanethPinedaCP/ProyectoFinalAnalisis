const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const path = require('path');
const { poolPromise } = require('../config/dbConfig');
const sql = require('mssql');

// Configurar Cloudinary con tus credenciales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configura multer para manejar las cargas de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directorio donde se guardarán las imágenes temporalmente
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombramos el archivo
  },
});

const upload = multer({ storage }).single('image'); // 'image' es el nombre del campo de formulario

// Función para manejar la carga de la imagen a Cloudinary y guardar en la base de datos
const subirImagen = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send('Error en la carga del archivo');
    }

    try {
      // Subir la imagen a Cloudinary
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        public_id: `promo_${Date.now()}`,
      });

      // Guardar la URL en la base de datos
      const query = `INSERT INTO Imagenespromo (imagen, activa, orden_posicion, fecha_creacion) 
                     VALUES (@imagen, @activa, @orden_posicion, GETDATE())`;  // Usamos GETDATE() para la fecha
      const params = {
        imagen: uploadResult.secure_url,  // La URL de la imagen subida
        activa: true,  // Imagen activa
        orden_posicion: 1,  // La posición en el slider
      };

      const pool = await poolPromise;  // Obtener el pool de conexión
      await pool.request()
        .input('imagen', sql.NVarChar, params.imagen)
        .input('activa', sql.Bit, params.activa)
        .input('orden_posicion', sql.Int, params.orden_posicion)
        .query(query);

      res.json({ success: true, url: uploadResult.secure_url });
    } catch (error) {
      console.error('Error subiendo la imagen:', error);
      res.status(500).send('Error subiendo la imagen');
    }
  });
};

// Función para ver las imágenes activas
const verImagen = async (req, res) => {
  try {
    const pool = await poolPromise;
    // Consulta para obtener las imágenes activas y ordenadas por su posición
    const result = await pool.request()
      .query('SELECT imagen FROM Imagenespromo WHERE activa = 1 ORDER BY orden_posicion');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener las imágenes:', error);
    res.status(500).send('Error al obtener las imágenes');
  }
};

module.exports = { subirImagen, verImagen };
