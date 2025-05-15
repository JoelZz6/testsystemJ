const express = require('express');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const {
  validarRegistro,
  registrar,
  validarInicioSesion,
  iniciarSesion,
  listarComerciantesHandler,
  listarUsuariosHandler,
  cambiarRolHandler,
} = require('../controllers/usuarios');
const { body } = require('express-validator');

const router = express.Router();

router.post('/registrar', validarRegistro, registrar);
router.post('/login', validarInicioSesion, iniciarSesion);
router.get('/comerciantes', verificarToken, verificarAdmin, listarComerciantesHandler);
router.get('/', verificarToken, verificarAdmin, listarUsuariosHandler);
router.put(
  '/cambiar-rol',
  verificarToken,
  verificarAdmin,
  [
    body('usuario_id').isInt().withMessage('El ID de usuario debe ser un número entero'),
    body('rol').notEmpty().withMessage('El rol es obligatorio'),
  ],
  cambiarRolHandler
);

module.exports = router;