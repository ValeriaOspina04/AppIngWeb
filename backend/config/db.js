const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST,      // <--- Cambiado
  user: process.env.MYSQL_ADDON_USER,      // <--- Cambiado
  password: process.env.MYSQL_ADDON_PASSWORD,  // <--- Cambiado
  database: process.env.MYSQL_ADDON_DB,    // <--- Cambiado
  port: process.env.MYSQL_ADDON_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
    connectTimeout: 20000,
});

module.exports = pool.promise();
