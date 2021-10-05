// database connetion
const mysql = require('mysql');

// config doteve module
require('dotenv').config();

// create a connection pool
const connection = mysql.createPool({
    connectionLimit:100,
    host:process.env.HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD || '',
    database:process.env.DB_NAME
});

module.exports = connection;