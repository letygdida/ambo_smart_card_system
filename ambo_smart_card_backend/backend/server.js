// Clear require cache for routes to ensure latest code is loaded
delete require.cache[require.resolve("./routes/reports_new")];
delete require.cache[require.resolve("./routes/students")];
delete require.cache[require.resolve("./routes/dashboard")];
delete require.cache[require.resolve("./routes/attendance")];
delete require.cache[require.resolve("./routes/text-reports")];
delete require.cache[require.resolve("./routes/detailed-reports")];

const reportRoutes = require("./routes/reports_new");
const textReportRoutes = require("./routes/text-reports");
const detailedReportRoutes = require("./routes/detailed-reports");
const dashboardRoutes = require("./routes/dashboard");
const attendanceRoutes = require("./routes/attendance");
console.log("✓ Attendance routes loaded, routes count:", attendanceRoutes.stack ? attendanceRoutes.stack.length : 0);
const cafeteriaAttendanceRoutes = require("./routes/cafeteria-attendance");
console.log("✓ Cafeteria attendance routes loaded");
const mealConfigRoutes = require("./routes/meal-config");
console.log("✓ Meal configuration routes loaded");
const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departments");
const cardRoutes = require("./routes/cards");
const studentRoutes = require("./routes/students");
const registrationRoutes = require("./routes/registrations");
const adminRoutes = require("./routes/admin");
const employeeAttendanceControlRoutes = require("./routes/employee-attendance-control");
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const db = require("./db");
const authRoutes = require("./routes/auth");
const attendanceScheduler = require("./services/attendance-scheduler");

const app = express();

app.use(cors());

// Skip body parsing for multipart requests - let multer handle them
// Only parse JSON and URL-encoded for non-multipart requests
const isMultipart = (req) => {
  const contentType = req.get('content-type') || '';
  return contentType.includes('multipart/form-data');
};

// Increase payload size limits for file uploads
// Skip parsing if multipart so multer can handle it
app.use((req, res, next) => {
  if (isMultipart(req)) {
    return next(); // Skip body parsing, let multer handle it
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (isMultipart(req)) {
    return next(); // Skip body parsing, let multer handle it
  }
  express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const employeeUploadsDir = path.join(uploadsDir, 'employees');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(employeeUploadsDir)) {
  fs.mkdirSync(employeeUploadsDir, { recursive: true });
}

// Serve static files with absolute paths
console.log('Serving uploads from:', uploadsDir);
app.use("/uploads", express.static(uploadsDir));

// Middleware to ensure req.body is always an object BEFORE routes
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  if (req.body === undefined) {
    req.body = {};
  }
  next();
});

// Routes
app.use("/api/reports", reportRoutes);
app.use("/api/text-reports", textReportRoutes);
app.use("/api/detailed-reports", detailedReportRoutes);
app.use("/api/dashboard", dashboardRoutes);

console.log("Loading auth routes with", authRoutes.stack ? authRoutes.stack.length : 0, "routes");
app.use("/api/auth", authRoutes);
console.log("Auth routes registered at /api/auth");

console.log("Loading registration routes with", registrationRoutes.stack ? registrationRoutes.stack.length : 0, "routes");
app.use("/api/registrations", registrationRoutes);
console.log("Registration routes registered at /api/registrations");

app.use("/api/students", studentRoutes);
app.use("/api/cards", cardRoutes);
console.log("✓ Registering attendance routes with", attendanceRoutes.stack ? attendanceRoutes.stack.length : "unknown number of", "routes");
console.log("Attendance routes details:", attendanceRoutes.stack ? attendanceRoutes.stack.slice(0, 3).map(l => l.route ? l.route.path + ' ' + Object.keys(l.route.methods).join(',') : 'middleware').join(' | ') : 'NO STACK');
app.use("/api/attendance", attendanceRoutes);
console.log("✓ Attendance routes registered at /api/attendance");

// Register cafeteria attendance routes (separate from main attendance)
app.use("/api/cafeteria", cafeteriaAttendanceRoutes);
console.log("✓ Cafeteria attendance routes registered at /api/cafeteria");

// Register meal configuration routes (separate from main attendance)
app.use("/api/meal-config", mealConfigRoutes);
console.log("✓ Meal configuration routes registered at /api/meal-config");

app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin", adminRoutes);
console.log("✓ Admin settings routes registered at /api/admin");

app.use("/api/employee-attendance-control", employeeAttendanceControlRoutes);
console.log("✓ Employee attendance control routes registered at /api/employee-attendance-control");

app.get("/", (req,res)=>{
    res.send("Ambo University Smart Card API Running");
});

app.listen(5000,()=>{
    console.log("Server running on port 5000");
    
    // Start automatic attendance scheduler
    console.log("\n=== Starting Attendance Automation ===");
    attendanceScheduler.start();
    console.log("======================================\n");
});

// Global error handler (MUST be last middleware)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large - maximum 5MB' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});