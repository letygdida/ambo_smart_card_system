const mysql = require("mysql2");

// Create a connection pool for better stability
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true
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
