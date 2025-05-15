const express = require('express');
const { verificarToken, verificarAdmin, verificarAdminOComerciante } = require('../middleware/auth');
const {
  crearMicroempresaHandler,
  validarMicroempresa,
  editarMicroempresaHandler,
  eliminarMicroempresaHandler,
  listarMicroempresasHandler,
  obtenerMicroempresaComercianteHandler,
  agregarProductoHandler,
  validarProducto,
} = require('../controllers/microempresas');
const uploadMiddleware = require('../middleware/upload');

const router = express.Router();

router.post('/', verificarToken, verificarAdmin, validarMicroempresa, crearMicroempresaHandler);
router.put('/:id', verificarToken, verificarAdmin, validarMicroempresa, editarMicroempresaHandler);
router.delete('/:id', verificarToken, verificarAdmin, eliminarMicroempresaHandler);
router.get('/', verificarToken, verificarAdmin, listarMicroempresasHandler);
router.get('/mi-microempresa', verificarToken, verificarAdminOComerciante, obtenerMicroempresaComercianteHandler);
router.post('/productos', verificarToken, verificarAdminOComerciante, uploadMiddleware, validarProducto, agregarProductoHandler);

module.exports = router;