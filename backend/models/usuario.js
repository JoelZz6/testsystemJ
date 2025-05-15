const { mainPool } = require('../config/db');
const bcrypt = require('bcrypt');

const registrarUsuario = async ({ nombre_usuario, correo, contrasena }) => {
  const hashedPassword = await bcrypt.hash(contrasena, 10);
  const query = `
    INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol)
    VALUES ($1, $2, $3, 'cliente')
    RETURNING id, nombre_usuario, correo, rol
  `;
  const values = [nombre_usuario, correo, hashedPassword];
  const result = await mainPool.query(query, values);
  return result.rows[0];
};

const encontrarUsuarioPorCorreo = async (correo) => {
  const query = 'SELECT * FROM usuarios WHERE correo = $1';
  const result = await mainPool.query(query, [correo]);
  return result.rows[0];
};

const listarComerciantes = async () => {
  const query = "SELECT id, nombre_usuario FROM usuarios WHERE rol = 'comerciante'";
  const result = await mainPool.query(query);
  return result.rows;
};

const listarUsuarios = async () => {
  const query = 'SELECT id, nombre_usuario, correo, rol FROM usuarios';
  const result = await mainPool.query(query);
  return result.rows;
};

const cambiarRolUsuario = async (usuario_id, rol) => {
  const query = `
    UPDATE usuarios
    SET rol = $1
    WHERE id = $2
    RETURNING id, nombre_usuario, correo, rol
  `;
  const values = [rol, usuario_id];
  const result = await mainPool.query(query, values);
  return result.rows[0];
};

const obtenerPerfil = async (usuario_id) => {
  const query = 'SELECT id, nombre_usuario, correo, rol FROM usuarios WHERE id = $1';
  const result = await mainPool.query(query, [usuario_id]);
  if (result.rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }
  return result.rows[0];
};

const actualizarPerfil = async (usuario_id, { nombre_usuario, correo, contrasena_actual, nueva_contrasena }) => {
  // Obtener el usuario actual
  const usuarioQuery = 'SELECT contrasena FROM usuarios WHERE id = $1';
  const usuarioResult = await mainPool.query(usuarioQuery, [usuario_id]);
  if (usuarioResult.rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar la contraseña actual
  const contrasenaCorrecta = await bcrypt.compare(contrasena_actual, usuarioResult.rows[0].contrasena);
  if (!contrasenaCorrecta) {
    throw new Error('Contraseña actual incorrecta');
  }

  // Construir la consulta de actualización dinámicamente
  let updateQuery = 'UPDATE usuarios SET ';
  const values = [];
  let paramIndex = 1;

  if (nombre_usuario) {
    updateQuery += `nombre_usuario = $${paramIndex}, `;
    values.push(nombre_usuario);
    paramIndex++;
  }
  if (correo) {
    updateQuery += `correo = $${paramIndex}, `;
    values.push(correo);
    paramIndex++;
  }
  if (nueva_contrasena) {
    const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);
    updateQuery += `contrasena = $${paramIndex}, `;
    values.push(hashedPassword);
    paramIndex++;
  }

  // Remover la última coma y espacio
  updateQuery = updateQuery.slice(0, -2);
  updateQuery += ` WHERE id = $${paramIndex} RETURNING id, nombre_usuario, correo, rol`;
  values.push(usuario_id);

  const result = await mainPool.query(updateQuery, values);
  return result.rows[0];
};

module.exports = {
  registrarUsuario,
  encontrarUsuarioPorCorreo,
  listarComerciantes,
  listarUsuarios,
  cambiarRolUsuario,
  obtenerPerfil,
  actualizarPerfil,
};