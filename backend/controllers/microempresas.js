const { crearMicroempresa, editarMicroempresa, eliminarMicroempresa, listarMicroempresas, obtenerMicroempresaPorId } = require('../models/microempresa');
const { obtenerMicroempresaComerciante, agregarProducto } = require('../models/comerciante');
const { mainPool } = require('../config/db');
const { body, validationResult } = require('express-validator');

const validarMicroempresa = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres'),
  body('nombre_base_datos')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El nombre de la base de datos no puede exceder 50 caracteres')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('El nombre de la base de datos solo puede contener letras minúsculas, números y guiones bajos'),
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('tipo')
    .optional()
    .isIn(['base_datos', 'esquema'])
    .withMessage('El tipo debe ser "base_datos" o "esquema"'),
  body('usuario_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) {
        return true;
      }
      if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
        throw new Error('El ID del comerciante debe ser un número entero positivo');
      }
      return true;
    }),
];

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

const crearMicroempresaHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { nombre, descripcion, nombre_base_datos, tipo } = req.body;
    const microempresa = await crearMicroempresa(nombre, descripcion, nombre_base_datos, tipo);
    res.status(201).json({ mensaje: 'Microempresa creada', microempresa });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al crear microempresa' });
  }
};

const editarMicroempresaHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { nombre, descripcion, nombre_base_datos, usuario_id } = req.body;
    const usuarioIdFinal = usuario_id === '' || usuario_id === undefined ? undefined : usuario_id;
    const microempresa = await editarMicroempresa(id, nombre, descripcion, nombre_base_datos, usuarioIdFinal);
    res.json({ mensaje: 'Microempresa actualizada', microempresa });
  } catch (error) {
    console.error('Error al actualizar microempresa:', error);
    if (error.message === 'Microempresa no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'El nombre de la base de datos o esquema ya está en uso') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'El comerciante especificado no existe o no tiene el rol correcto') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al actualizar microempresa' });
  }
};

const eliminarMicroempresaHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const microempresa = await eliminarMicroempresa(id);
    res.json({ mensaje: 'Microempresa eliminada', microempresa });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al eliminar microempresa' });
  }
};

const listarMicroempresasHandler = async (req, res) => {
  try {
    const microempresas = await listarMicroempresas();
    res.json({ microempresas });
  } catch (error) {
    console.error('Error al listar microempresas:', error);
    res.status(500).json({ error: 'Error al listar microempresas' });
  }
};

const obtenerMicroempresaComercianteHandler = async (req, res) => {
  try {
    const microempresa = await obtenerMicroempresaComerciante(req.usuario.id);
    if (!microempresa) {
      return res.status(404).json({ error: 'No tienes una microempresa asignada' });
    }
    res.json({ microempresa });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener microempresa' });
  }
};

const agregarProductoHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const microempresa = await obtenerMicroempresaComerciante(req.usuario.id);
    if (!microempresa) {
      return res.status(404).json({ error: 'No tienes una microempresa asignada' });
    }
    const { nombre, descripcion, stock, precio } = req.body;
    let atributos = req.body.atributos;
    try {
      atributos = typeof atributos === 'string' ? JSON.parse(atributos) : atributos;
    } catch (e) {
      return res.status(400).json({ error: 'El campo atributos debe ser un JSON válido o un arreglo' });
    }
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;
    const producto = await agregarProducto(microempresa.base_datos, microempresa.tipo, { nombre, descripcion, imagen, stock, precio }, atributos);
    const io = req.app.get('socketio');
    io.emit('nuevoProducto', {
      id: producto.productoId,
      nombre,
      descripcion,
      imagen,
      stock,
      precio,
      atributos,
      microempresa_nombre: microempresa.nombre,
    });
    res.status(201).json({ mensaje: 'Producto agregado', producto });
  } catch (error) {
    console.error('Error al agregar producto:', error);
    if (error.message.includes('no existe la relación') || error.message.includes('no existe la base de datos')) {
      return res.status(400).json({ error: 'El esquema o base de datos no existe' });
    }
    if (error.message.includes('Solo se permiten imágenes')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error al agregar producto' });
  }
};

module.exports = {
  crearMicroempresaHandler,
  validarMicroempresa,
  editarMicroempresaHandler,
  eliminarMicroempresaHandler,
  listarMicroempresasHandler,
  obtenerMicroempresaComercianteHandler,
  agregarProductoHandler,
  validarProducto,
};