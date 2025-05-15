const { Pool } = require('pg');
require('dotenv').config();

// Conexión a la base de datos principal
const mainPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Conexión a la base de datos microempresas
const microempresasPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'microempresas',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = { mainPool, microempresasPool };