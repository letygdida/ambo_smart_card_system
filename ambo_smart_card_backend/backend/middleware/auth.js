const jwt = require("jsonwebtoken");

// VERIFY TOKEN MIDDLEWARE
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        console.log("No authorization header provided");
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    if (!token) {
        console.log("No token found in authorization header");
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, "smartcard_secret");
        req.user = decoded;
        console.log("Token verified for user:", decoded.username, "Role:", decoded.role);
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({ error: "Invalid token: " + error.message });
    }
};

// ADMIN ONLY MIDDLEWARE
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }
    
    if (req.user.role !== "admin") {
        console.log(`Access denied: ${req.user.username} (${req.user.role}) attempted admin-only action`);
        return res.status(403).json({ 
            error: "Access denied. Admin privileges required.",
            message: "Only administrators can perform this action"
        });
    }
    
    console.log(`Admin access granted: ${req.user.username}`);
    next();
};

module.exports = { verifyToken, adminOnly };
