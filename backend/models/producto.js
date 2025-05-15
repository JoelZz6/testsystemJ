const { Pool } = require('pg');
const { mainPool, microempresasPool } = require('../config/db');

const obtenerTodosProductos = async () => {
  // Obtener todas las microempresas
  const microempresasQuery = 'SELECT id, nombre, base_datos, tipo FROM microempresas';
  const microempresasResult = await mainPool.query(microempresasQuery);
  const microempresas = microempresasResult.rows;

  let todosProductos = [];

  // Iterar sobre cada microempresa
  for (const { id, nombre, base_datos, tipo } of microempresas) {
    try {
      let productosResult;
      if (tipo === 'base_datos') {
        const microempresaPool = new Pool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: base_datos,
        });

        try {
          // Obtener productos
          const productosQuery = `
            SELECT id, nombre, descripcion, imagen, stock, precio, fecha_creacion
            FROM productos
          `;
          productosResult = await microempresaPool.query(productosQuery);
        } finally {
          await microempresaPool.end();
        }
      } else if (tipo === 'esquema') {
        // Usar microempresasPool para consultar el esquema
        const productosQuery = `
          SELECT id, nombre, descripcion, imagen, stock, precio, fecha_creacion
          FROM "${base_datos}".productos
        `;
        productosResult = await microempresasPool.query(productosQuery);
      } else {
        console.warn(`Tipo desconocido para microempresa ${nombre}: ${tipo}`);
        continue;
      }

      // Obtener atributos para cada producto
      for (const producto of productosResult.rows) {
        let atributosResult;
        if (tipo === 'base_datos') {
          const microempresaPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: base_datos,
          });

          try {
            const atributosQuery = 'SELECT clave, valor FROM atributos WHERE producto_id = $1';
            atributosResult = await microempresaPool.query(atributosQuery, [producto.id]);
          } finally {
            await microempresaPool.end();
          }
        } else if (tipo === 'esquema') {
          const atributosQuery = `SELECT clave, valor FROM "${base_datos}".atributos WHERE producto_id = $1`;
          atributosResult = await microempresasPool.query(atributosQuery, [producto.id]);
        }

        producto.atributos = atributosResult.rows;
        producto.microempresa_nombre = nombre;
        producto.microempresa_id = id;
        todosProductos.push(producto);
      }
    } catch (error) {
      console.error(`Error al procesar microempresa ${nombre} (${base_datos}, tipo: ${tipo}):`, error.message);
      continue; // Continuar con la siguiente microempresa
    }
  }

  return todosProductos;
};

const obtenerProductosComerciante = async (base_datos, tipo) => {
  let productosResult;
  if (tipo === 'base_datos') {
    const microempresaPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: base_datos,
    });

    try {
      const productosQuery = `
        SELECT id, nombre, descripcion, imagen, stock, precio, fecha_creacion
        FROM productos
      `;
      productosResult = await microempresaPool.query(productosQuery);
    } finally {
      await microempresaPool.end();
    }
  } else if (tipo === 'esquema') {
    const productosQuery = `
      SELECT id, nombre, descripcion, imagen, stock, precio, fecha_creacion
      FROM "${base_datos}".productos
    `;
    productosResult = await microempresasPool.query(productosQuery);
  } else {
    throw new Error(`Tipo inválido: ${tipo}`);
  }

  const productos = productosResult.rows;

  for (const producto of productos) {
    let atributosResult;
    if (tipo === 'base_datos') {
      const microempresaPool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: base_datos,
      });

      try {
        const atributosQuery = 'SELECT clave, valor FROM atributos WHERE producto_id = $1';
        atributosResult = await microempresaPool.query(atributosQuery, [producto.id]);
      } finally {
        await microempresaPool.end();
      }
    } else if (tipo === 'esquema') {
      const atributosQuery = `SELECT clave, valor FROM "${base_datos}".atributos WHERE producto_id = $1`;
      atributosResult = await microempresasPool.query(atributosQuery, [producto.id]);
    }

    producto.atributos = atributosResult.rows;
  }

  return productos;
};

const actualizarProducto = async (base_datos, tipo, producto_id, { nombre, descripcion, imagen, stock, precio }, atributos) => {
  let productoResult;
  if (tipo === 'base_datos') {
    const microempresaPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: base_datos,
    });

    try {
      // Actualizar producto
      const productoQuery = `
        UPDATE productos
        SET nombre = $1, descripcion = $2, imagen = $3, stock = $4, precio = $5
        WHERE id = $6
        RETURNING id, nombre, descripcion, imagen, stock, precio, fecha_creacion
      `;
      const productoValues = [nombre, descripcion || null, imagen || null, stock, precio, producto_id];
      productoResult = await microempresaPool.query(productoQuery, productoValues);

      // Eliminar atributos existentes
      await microempresaPool.query('DELETE FROM atributos WHERE producto_id = $1', [producto_id]);

      // Insertar nuevos atributos
      const nuevosAtributos = [];
      for (const { clave, valor } of atributos) {
        const atributoQuery = `
          INSERT INTO atributos (producto_id, clave, valor)
          VALUES ($1, $2, $3)
          RETURNING id, clave, valor
        `;
        const atributoResult = await microempresaPool.query(atributoQuery, [producto_id, clave, valor]);
        nuevosAtributos.push(atributoResult.rows[0]);
      }

      return { producto: productoResult.rows[0], atributos: nuevosAtributos };
    } finally {
      await microempresaPool.end();
    }
  } else if (tipo === 'esquema') {
    // Actualizar producto
    const productoQuery = `
      UPDATE "${base_datos}".productos
      SET nombre = $1, descripcion = $2, imagen = $3, stock = $4, precio = $5
      WHERE id = $6
      RETURNING id, nombre, descripcion, imagen, stock, precio, fecha_creacion
    `;
    const productoValues = [nombre, descripcion || null, imagen || null, stock, precio, producto_id];
    productoResult = await microempresasPool.query(productoQuery, productoValues);

    // Eliminar atributos existentes
    await microempresasPool.query(`DELETE FROM "${base_datos}".atributos WHERE producto_id = $1`, [producto_id]);

    // Insertar nuevos atributos
    const nuevosAtributos = [];
    for (const { clave, valor } of atributos) {
      const atributoQuery = `
        INSERT INTO "${base_datos}".atributos (producto_id, clave, valor)
        VALUES ($1, $2, $3)
        RETURNING id, clave, valor
      `;
      const atributoResult = await microempresasPool.query(atributoQuery, [producto_id, clave, valor]);
      nuevosAtributos.push(atributoResult.rows[0]);
    }

    return { producto: productoResult.rows[0], atributos: nuevosAtributos };
  } else {
    throw new Error(`Tipo inválido: ${tipo}`);
  }
};

const eliminarProducto = async (base_datos, tipo, producto_id) => {
  if (tipo === 'base_datos') {
    const microempresaPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: base_datos,
    });

    try {
      // Eliminar producto (los atributos se eliminan automáticamente por ON DELETE CASCADE)
      const query = 'DELETE FROM productos WHERE id = $1 RETURNING id';
      const result = await microempresaPool.query(query, [producto_id]);
      if (result.rows.length === 0) {
        throw new Error('Producto no encontrado');
      }
      return result.rows[0];
    } finally {
      await microempresaPool.end();
    }
  } else if (tipo === 'esquema') {
    const query = `DELETE FROM "${base_datos}".productos WHERE id = $1 RETURNING id`;
    const result = await microempresasPool.query(query, [producto_id]);
    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }
    return result.rows[0];
  } else {
    throw new Error(`Tipo inválido: ${tipo}`);
  }
};

module.exports = {
  obtenerTodosProductos,
  obtenerProductosComerciante,
  actualizarProducto,
  eliminarProducto,
};