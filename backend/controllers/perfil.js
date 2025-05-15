const { obtenerPerfil, actualizarPerfil } = require('../models/usuario');
const { body, validationResult } = require('express-validator');

const validarPerfil = [
  body('nombre_usuario')
    .optional()
    .notEmpty()
    .withMessage('El nombre de usuario no puede estar vacío')
    .isLength({ max: 50 })
    .withMessage('El nombre de usuario no puede exceder 50 caracteres'),
  body('correo')
    .optional()
    .isEmail()
    .withMessage('El correo debe ser válido')
    .isLength({ max: 100 })
    .withMessage('El correo no puede exceder 100 caracteres'),
  body('contrasena_actual')
    .notEmpty()
    .withMessage('La contraseña actual es obligatoria'),
  body('nueva_contrasena')
    .optional()
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
];

const obtenerPerfilHandler = async (req, res) => {
  try {
    const perfil = await obtenerPerfil(req.usuario.id);
    res.json({ perfil });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al obtener perfil' });
  }
};

const actualizarPerfilHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_usuario, correo, contrasena_actual, nueva_contrasena } = req.body;
    const perfil = await actualizarPerfil(req.usuario.id, {
      nombre_usuario,
      correo,
      contrasena_actual,
      nueva_contrasena,
    });

    res.json({ mensaje: 'Perfil actualizado', perfil });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al actualizar perfil' });
  }
};

module.exports = { obtenerPerfilHandler, actualizarPerfilHandler, validarPerfil };