const express = require('express');
const { verificarToken } = require('../middleware/auth');
const { verificarTokenHandler } = require('../controllers/auth');

const router = express.Router();

router.get('/verificar', verificarToken, verificarTokenHandler);

module.exports = router;