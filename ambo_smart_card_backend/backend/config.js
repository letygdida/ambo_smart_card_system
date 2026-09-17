// Backend configuration for Ambo University Smart Card System
// Uses environment variables for security

const config = {
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || "smartcard_secret",  // Override with environment variable in production
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",  // Default 7 days

    // Database (handled by db.js)
    // Server
    PORT: process.env.PORT || process.env.RENDER_PORT || 5000
};

module.exports = config;
