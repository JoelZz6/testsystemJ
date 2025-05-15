const express = require('express');
const { verificarToken } = require('../middleware/auth');
const { obtenerPerfilHandler, actualizarPerfilHandler, validarPerfil } = require('../controllers/perfil');

const router = express.Router();

router.get('/', verificarToken, obtenerPerfilHandler);
router.put('/', verificarToken, validarPerfil, actualizarPerfilHandler);

module.exports = router;