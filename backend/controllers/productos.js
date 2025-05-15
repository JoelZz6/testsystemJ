const { obtenerTodosProductos, obtenerProductosComerciante, actualizarProducto, eliminarProducto } = require('../models/producto');
const { obtenerMicroempresaComerciante } = require('../models/comerciante');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

const validarProducto = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre del producto es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero no negativo'),
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número no negativo'),
  body('atributos')
    .custom((value) => {
      let atributos;
      try {
        atributos = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        throw new Error('El campo atributos debe ser un JSON válido o un arreglo');
      }
      if (!Array.isArray(atributos)) {
        throw new Error('Los atributos deben ser un arreglo');
      }
      // Permitir arreglo vacío
      if (atributos.length === 0) {
        return true;
      }
      for (const attr of atributos) {
        if (!attr.clave || !attr.valor) {
          throw new Error('Cada atributo debe tener una clave y un valor no vacíos');
        }
        if (attr.clave.length > 50 || attr.valor.length > 100) {
          throw new Error('La clave no puede exceder 50 caracteres y el valor 100 caracteres');
        }
      }
      return true;
    }),
];

const obtenerProductosHandler = async (req, res) => {
  try {
    const productos = await obtenerTodosProductos();
    res.json({ productos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const obtenerProductosComercianteHandler = async (req, res) => {
  try {
    const microempresa = await obtenerMicroempresaComerciante(req.usuario.id);
    if (!microempresa) {
      return res.status(404).json({ error: 'No tienes una microempresa asignada' });
    }
    const productos = await obtenerProductosComerciante(microempresa.base_datos, microempresa.tipo);
    res.json({ productos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const actualizarProductoHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const microempresa = await obtenerMicroempresaComerciante(req.usuario.id);
    if (!microempresa) {
      return res.status(404).json({ error: 'No tienes una microempresa asignada' });
    }

    const { id } = req.params;
    const { nombre, descripcion, stock, precio } = req.body;
    let atributos = req.body.atributos;
    try {
      atributos = typeof atributos === 'string' ? JSON.parse(atributos) : atributos;
    } catch (e) {
      return res.status(400).json({ error: 'El campo atributos debe ser un JSON válido o un arreglo' });
    }

    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    // Obtener el producto actual para eliminar la imagen anterior si existe
    const productos = await obtenerProductosComerciante(microempresa.base_datos, microempresa.tipo);
    const productoActual = productos.find((p) => p.id === parseInt(id));
    if (!productoActual) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si se subió una nueva imagen, eliminar la anterior
    if (imagen && productoActual.imagen) {
      const oldImagePath = path.join(__dirname, '..', productoActual.imagen);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.warn(`No se pudo eliminar la imagen anterior: ${oldImagePath}`, err);
      }
    }

    const producto = await actualizarProducto(
      microempresa.base_datos,
      microempresa.tipo,
      id,
      {
        nombre,
        descripcion,
        imagen: imagen || productoActual.imagen,
        stock,
        precio,
      },
      atributos
    );

    // Emitir evento WebSocket
    const io = req.app.get('socketio');
    io.emit('productoActualizado', {
      id: producto.producto.id,
      nombre,
      descripcion,
      imagen: producto.producto.imagen,
      stock,
      precio,
      atributos,
      microempresa_nombre: microempresa.nombre,
    });

    res.json({ mensaje: 'Producto actualizado', producto });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('no existe la relación') || error.message.includes('no existe la base de datos')) {
      return res.status(400).json({ error: 'El esquema o base de datos no existe' });
    }
    if (error.message.includes('Solo se permiten imágenes')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error al actualizar producto' });
  }
};

const eliminarProductoHandler = async (req, res) => {
  try {
    const microempresa = await obtenerMicroempresaComerciante(req.usuario.id);
    if (!microempresa) {
      return res.status(404).json({ error: 'No tienes una microempresa asignada' });
    }

    const { id } = req.params;
    const productos = await obtenerProductosComerciante(microempresa.base_datos, microempresa.tipo);
    const producto = productos.find((p) => p.id === parseInt(id));
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar la imagen del servidor si existe
    if (producto.imagen) {
      const imagePath = path.join(__dirname, '..', producto.imagen);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.warn(`No se pudo eliminar la imagen: ${imagePath}`, err);
      }
    }

    const resultado = await eliminarProducto(microempresa.base_datos, microempresa.tipo, id);

    // Emitir evento WebSocket
    const io = req.app.get('socketio');
    io.emit('productoEliminado', { id });

    res.json({ mensaje: 'Producto eliminado', producto: resultado });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('no existe la relación') || error.message.includes('no existe la base de datos')) {
      return res.status(400).json({ error: 'El esquema o base de datos no existe' });
    }
    res.status(500).json({ error: error.message || 'Error al eliminar producto' });
  }
};

module.exports = {
  obtenerProductosHandler,
  obtenerProductosComercianteHandler,
  actualizarProductoHandler,
  eliminarProductoHandler,
  validarProducto,
};