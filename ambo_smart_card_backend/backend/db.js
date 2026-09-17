const mysql = require("mysql2");
const path = require("path");
const fs = require("fs");

// Safe startup checks - report which variables are set (without printing passwords)
console.log('\n--- Database Configuration Check ---');
console.log('DB_HOST:', process.env.DB_HOST ? 'set' : 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT ? 'set' : 'NOT SET');
console.log('DB_USER:', process.env.DB_USER ? 'set' : 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'set' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME ? 'set' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL ? 'set' : 'NOT SET');
console.log('--------------------------------------\n');

// Check if required variables are missing
const missingVars = [];
if (!process.env.DB_HOST) missingVars.push('DB_HOST');
if (!process.env.DB_USER) missingVars.push('DB_USER');
if (!process.env.DB_PASSWORD) missingVars.push('DB_PASSWORD');
if (!process.env.DB_NAME) missingVars.push('DB_NAME');

if (missingVars.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Set them using: $env:DB_HOST="..."; $env:DB_USER="..."; $env:DB_PASSWORD="..."; $env:DB_NAME="..."');
    process.exit(1);
}

// Load .env file if it exists (for local development convenience)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`Loaded .env from: ${envPath}`);
} else {
    console.log('No .env file found, using environment variables only');
}

// Create a connection pool for better stability
// Environment variables take precedence, with sensible defaults for local development
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
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
