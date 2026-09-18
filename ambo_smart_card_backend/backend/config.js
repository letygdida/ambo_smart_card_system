// Backend configuration for Ambo University Smart Card System
// Uses environment variables for security

const config = {
    // JWT Configuration
    JWT_SECRET: "smartcard_secret",
    JWT_EXPIRES_IN: "7d",

    // Database (handled by db.js)
    // Server
    PORT: process.env.PORT || process.env.RENDER_PORT || 5000
};

module.exports = config;
