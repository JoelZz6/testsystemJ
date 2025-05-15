const { mainPool, microempresasPool } = require('../config/db');
const { Pool } = require('pg');

const crearMicroempresa = async (nombre, descripcion, nombreBaseDatos, tipo) => {
  const client = await mainPool.connect();
  try {
    // Sanitizar el nombre de la base de datos o esquema
    const sanitizedName = `me_${nombreBaseDatos.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

    // Verificar si el nombre ya está en uso
    const existeQuery = 'SELECT 1 FROM microempresas WHERE base_datos = $1';
    const existeResult = await client.query(existeQuery, [sanitizedName]);
    if (existeResult.rows.length > 0) {
      throw new Error('El nombre de la base de datos o esquema ya está en uso');
    }

    // Crear base de datos fuera de la transacción si es necesario
    if (tipo === 'base_datos') {
      try {
        // Usar un cliente separado para CREATE DATABASE
        const tempClient = await new Pool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: 'postgres', // Conectar a la base de datos por defecto
        }).connect();
        try {
          await tempClient.query(`CREATE DATABASE "${sanitizedName}"`);
        } finally {
          await tempClient.release();
        }
      } catch (error) {
        if (error.code === '42P04') {
          throw new Error('La base de datos ya existe');
        }
        throw new Error(`Error al crear la base de datos: ${error.message}`);
      }
    }

    // Iniciar transacción para operaciones en la tabla microempresas
    await client.query('BEGIN');

    // Insertar en la tabla microempresas
    const insertQuery = `
      INSERT INTO microempresas (nombre, descripcion, base_datos, tipo)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, descripcion, base_datos, tipo
    `;
    const insertValues = [nombre, descripcion, sanitizedName, tipo];
    const insertResult = await client.query(insertQuery, insertValues);
    const microempresa = insertResult.rows[0];

    if (tipo === 'base_datos') {
      // Configurar la base de datos recién creada
      const microempresaPool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: sanitizedName,
      });
      try {
        await microempresaPool.query(`
          CREATE TABLE productos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            imagen VARCHAR(255),
            stock INTEGER NOT NULL DEFAULT 0,
            precio DECIMAL(10,2) NOT NULL,
            fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await microempresaPool.query(`
          CREATE TABLE atributos (
            id SERIAL PRIMARY KEY,
            producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
            clave VARCHAR(50) NOT NULL,
            valor VARCHAR(100) NOT NULL
          )
        `);
      } finally {
        await microempresaPool.end();
      }
    } else if (tipo === 'esquema') {
      // Crear esquema en la base de datos microempresas
      const microempresasClient = await microempresasPool.connect();
      try {
        await microempresasClient.query(`CREATE SCHEMA "${sanitizedName}"`);
        await microempresasClient.query(`
          CREATE TABLE "${sanitizedName}".productos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            imagen VARCHAR(255),
            stock INTEGER NOT NULL DEFAULT 0,
            precio DECIMAL(10,2) NOT NULL,
            fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await microempresasClient.query(`
          CREATE TABLE "${sanitizedName}".atributos (
            id SERIAL PRIMARY KEY,
            producto_id INTEGER REFERENCES "${sanitizedName}".productos(id) ON DELETE CASCADE,
            clave VARCHAR(50) NOT NULL,
            valor VARCHAR(100) NOT NULL
          )
        `);
      } finally {
        microempresasClient.release();
      }
    } else {
      throw new Error('Tipo inválido: debe ser "base_datos" o "esquema"');
    }

    await client.query('COMMIT');
    return microempresa;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const editarMicroempresa = async (id, nombre, descripcion, nombreBaseDatos, usuario_id) => {
  const pool = mainPool;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Sanitizar el nombre de la base de datos o esquema
    const sanitizedName = nombreBaseDatos
      ? `me_${nombreBaseDatos.toLowerCase().replace(/[^a-z0-9_]/g, '')}`
      : null;

    // Verificar si el nuevo nombre ya está en uso
    if (sanitizedName) {
      const existeQuery = 'SELECT 1 FROM microempresas WHERE base_datos = $1 AND id != $2';
      const existeResult = await client.query(existeQuery, [sanitizedName, id]);
      if (existeResult.rows.length > 0) {
        throw new Error('El nombre de la base de datos o esquema ya está en uso');
      }
    }

    // Obtener la microempresa actual
    const currentQuery = 'SELECT base_datos, tipo FROM microempresas WHERE id = $1';
    const currentResult = await client.query(currentQuery, [id]);
    if (currentResult.rows.length === 0) {
      throw new Error('Microempresa no encontrada');
    }
    const { base_datos: currentBaseDatos, tipo } = currentResult.rows[0];

    // Actualizar la microempresa
    let updateQuery = 'UPDATE microempresas SET ';
    const values = [];
    let paramIndex = 1;
    if (nombre) {
      updateQuery += `nombre = $${paramIndex}, `;
      values.push(nombre);
      paramIndex++;
    }
    if (descripcion !== undefined) {
      updateQuery += `descripcion = $${paramIndex}, `;
      values.push(descripcion);
      paramIndex++;
    }
    if (sanitizedName) {
      updateQuery += `base_datos = $${paramIndex}, `;
      values.push(sanitizedName);
      paramIndex++;
    }
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, nombre, descripcion, base_datos, tipo`;
    values.push(id);
    const result = await client.query(updateQuery, values);

    // Renombrar base de datos o esquema si cambió
    if (sanitizedName && currentBaseDatos !== sanitizedName) {
      if (tipo === 'base_datos') {
        const tempClient = await new Pool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: 'postgres',
        }).connect();
        try {
          await tempClient.query(`ALTER DATABASE "${currentBaseDatos}" RENAME TO "${sanitizedName}"`);
        } finally {
          await tempClient.release();
        }
      } else if (tipo === 'esquema') {
        const microempresasClient = await microempresasPool.connect();
        try {
          await microempresasClient.query(`ALTER SCHEMA "${currentBaseDatos}" RENAME TO "${sanitizedName}"`);
        } finally {
          microempresasClient.release();
        }
      }
    }

    // Manejar asignación/desasociación del comerciante
    if (usuario_id !== undefined) {
      await client.query(
        'DELETE FROM comerciantes_microempresas WHERE microempresa_id = $1',
        [id]
      );
      if (usuario_id !== null) {
        const usuarioQuery = `
          SELECT id FROM usuarios WHERE id = $1 AND rol = 'comerciante'
        `;
        const usuarioResult = await client.query(usuarioQuery, [usuario_id]);
        if (usuarioResult.rows.length === 0) {
          throw new Error('El comerciante especificado no existe o no tiene el rol correcto');
        }
        await client.query(
          'INSERT INTO comerciantes_microempresas (usuario_id, microempresa_id) VALUES ($1, $2)',
          [usuario_id, id]
        );
      }
    }

    await client.query('COMMIT');
    const microempresa = await obtenerMicroempresaPorId(id);
    return microempresa;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const eliminarMicroempresa = async (id) => {
  const pool = mainPool;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener la microempresa
    const query = 'SELECT base_datos, tipo FROM microempresas WHERE id = $1';
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      throw new Error('Microempresa no encontrada');
    }
    const { base_datos, tipo } = result.rows[0];

    // Eliminar base de datos o esquema
    if (tipo === 'base_datos') {
      const tempClient = await new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'postgres',
      }).connect();
      try {
        await tempClient.query(`DROP DATABASE IF EXISTS "${base_datos}"`);
      } finally {
        await tempClient.release();
      }
    } else if (tipo === 'esquema') {
      const microempresasClient = await microempresasPool.connect();
      try {
        await microempresasClient.query(`DROP SCHEMA IF EXISTS "${base_datos}" CASCADE`);
      } finally {
        microempresasClient.release();
      }
    }

    // Eliminar registro (las asignaciones en comerciantes_microempresas se eliminan por ON DELETE CASCADE)
    const deleteQuery = 'DELETE FROM microempresas WHERE id = $1 RETURNING id';
    const deleteResult = await client.query(deleteQuery, [id]);

    await client.query('COMMIT');
    return deleteResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listarMicroempresas = async () => {
  const pool = mainPool;
  const client = await pool.connect();
  try {
    const query = `
      SELECT m.id, m.nombre, m.descripcion, m.base_datos, m.tipo, cm.usuario_id AS comerciante_id, u.nombre_usuario AS comerciante_nombre
      FROM microempresas m
      LEFT JOIN comerciantes_microempresas cm ON m.id = cm.microempresa_id
      LEFT JOIN usuarios u ON cm.usuario_id = u.id
    `;
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
};

const obtenerMicroempresaPorId = async (id) => {
  const pool = mainPool;
  const client = await pool.connect();
  try {
    const query = `
      SELECT m.id, m.nombre, m.descripcion, m.base_datos, m.tipo, cm.usuario_id AS comerciante_id, u.nombre_usuario AS comerciante_nombre
      FROM microempresas m
      LEFT JOIN comerciantes_microempresas cm ON m.id = cm.microempresa_id
      LEFT JOIN usuarios u ON cm.usuario_id = u.id
      WHERE m.id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      throw new Error('Microempresa no encontrada');
    }
    return result.rows[0];
  } finally {
    client.release();
  }
};

module.exports = {
  crearMicroempresa,
  editarMicroempresa,
  eliminarMicroempresa,
  listarMicroempresas,
  obtenerMicroempresaPorId,
};