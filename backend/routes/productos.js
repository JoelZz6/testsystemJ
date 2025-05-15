const express = require('express');
const { verificarToken, verificarAdminOComerciante } = require('../middleware/auth');
const {
  obtenerProductosHandler,
  obtenerProductosComercianteHandler,
  actualizarProductoHandler,
  eliminarProductoHandler,
  validarProducto,
} = require('../controllers/productos');
const uploadMiddleware = require('../middleware/upload');

const router = express.Router();

router.get('/', verificarToken, obtenerProductosHandler);
router.get('/mis-productos', verificarToken, verificarAdminOComerciante, obtenerProductosComercianteHandler);
router.put('/:id', verificarToken, verificarAdminOComerciante, uploadMiddleware, validarProducto, actualizarProductoHandler);
router.delete('/:id', verificarToken, verificarAdminOComerciante, eliminarProductoHandler);

module.exports = router;