const { Pool } = require('pg');
const { mainPool, microempresasPool } = require('../config/db');

const microempresaPools = new Map();

const getMicroempresaPool = (database, tipo) => {
  if (tipo === 'base_datos') {
    if (!microempresaPools.has(database)) {
      const newPool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: database,
      });
      microempresaPools.set(database, newPool);
    }
    return microempresaPools.get(database);
  } else if (tipo === 'esquema') {
    return microempresasPool;
  }
  throw new Error('Tipo inválido: debe ser "base_datos" o "esquema"');
};

const asignarComerciante = async (usuarioId, microempresaId) => {
  const query = `
    INSERT INTO comerciantes_microempresas (usuario_id, microempresa_id)
    VALUES ($1, $2)
    RETURNING id, usuario_id, microempresa_id, fecha_asignacion
  `;
  const values = [usuarioId, microempresaId];
  const result = await mainPool.query(query, values);
  return result.rows[0];
};

const obtenerMicroempresaComerciante = async (usuarioId) => {
  const query = `
    SELECT m.id, m.nombre, m.descripcion, m.base_datos, m.tipo
    FROM microempresas m
    JOIN comerciantes_microempresas cm ON m.id = cm.microempresa_id
    WHERE cm.usuario_id = $1
  `;
  const result = await mainPool.query(query, [usuarioId]);
  return result.rows[0];
};

const agregarProducto = async (microempresaDb, tipo, producto, atributos) => {
  const pool = getMicroempresaPool(microempresaDb, tipo);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const schemaPrefix = tipo === 'esquema' ? `${microempresaDb}.` : '';
    const productoQuery = `
      INSERT INTO ${schemaPrefix}productos (nombre, descripcion, imagen, stock, precio)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const productoValues = [
      producto.nombre,
      producto.descripcion,
      producto.imagen,
      producto.stock,
      producto.precio,
    ];
    const productoResult = await client.query(productoQuery, productoValues);
    const productoId = productoResult.rows[0].id;

    for (const { clave, valor } of atributos) {
      const atributoQuery = `
        INSERT INTO ${schemaPrefix}atributos (producto_id, clave, valor)
        VALUES ($1, $2, $3)
      `;
      await client.query(atributoQuery, [productoId, clave, valor]);
    }

    await client.query('COMMIT');
    return { productoId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { asignarComerciante, obtenerMicroempresaComerciante, agregarProducto };