const { registrarUsuario, encontrarUsuarioPorCorreo, listarComerciantes, listarUsuarios, cambiarRolUsuario } = require('../models/usuario');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { mainPool } = require('../config/db');

const validarRegistro = [
  body('nombre_usuario')
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio')
    .isLength({ max: 50 })
    .withMessage('El nombre de usuario no puede exceder 50 caracteres'),
  body('correo')
    .isEmail()
    .withMessage('El correo debe ser válido')
    .isLength({ max: 100 })
    .withMessage('El correo no puede exceder 100 caracteres'),
  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
];

const validarInicioSesion = [
  body('correo')
    .isEmail()
    .withMessage('El correo debe ser válido'),
  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

const registrar = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_usuario, correo, contrasena } = req.body;
    const usuarioExistente = await encontrarUsuarioPorCorreo(correo);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const usuario = await registrarUsuario({ nombre_usuario, correo, contrasena });
    const token = jwt.sign(
      { id: usuario.id, nombre_usuario: usuario.nombre_usuario, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ mensaje: 'Usuario registrado', usuario, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const iniciarSesion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { correo, contrasena } = req.body;
    const usuario = await encontrarUsuarioPorCorreo(correo);
    if (!usuario) {
      return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre_usuario: usuario.nombre_usuario, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: { id: usuario.id, nombre_usuario: usuario.nombre_usuario, correo: usuario.correo, rol: usuario.rol },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

const listarComerciantesHandler = async (req, res) => {
  try {
    const comerciantes = await listarComerciantes();
    res.json({ comerciantes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar comerciantes' });
  }
};

const listarUsuariosHandler = async (req, res) => {
  try {
    const usuarios = await listarUsuarios();
    res.json({ usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

const cambiarRolHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { usuario_id, rol } = req.body;
    if (!['cliente', 'comerciante', 'administrador'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const usuario = await cambiarRolUsuario(usuario_id, rol);
    res.json({ mensaje: 'Rol actualizado', usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
};

module.exports = {
  validarRegistro,
  registrar,
  validarInicioSesion,
  iniciarSesion,
  listarComerciantesHandler,
  listarUsuariosHandler,
  cambiarRolHandler,
};