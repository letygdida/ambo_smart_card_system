const mysql = require("mysql2");
require("dotenv").config();

// Create a connection pool for better stability
// Environment variables take precedence, with sensible defaults for local development
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ambo_smart_card",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: true
    } : undefined
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Pool error:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection was closed.');
    }
    if(err.code === 'ER_CON_COUNT_ERROR') {
        console.log('Database has too many connections.');
    }
    if(err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.log('Database connection was closed.');
    }
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.log('Database connection failed:', err);
    } else {
        console.log('MySQL Connected Successfully');
        connection.release();
    }
});

// Wrap pool.query to use callback style (for compatibility)
const db = {
    query: (sql, values, callback) => {
        // Handle optional values parameter
        if (typeof values === 'function') {
            callback = values;
            values = [];
        }

        pool.query(sql, values, (error, results) => {
            if (error) {
                console.error('Query error:', error);
                return callback(error);
            }
            callback(null, results);
        });
    }
};

module.exports = db;
