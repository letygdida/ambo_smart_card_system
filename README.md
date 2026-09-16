# Ambo University Smart Card Management System

A comprehensive smart card management system for Ambo University designed to streamline student and employee identification, attendance tracking, and cafeteria management through QR/barcode scanning and digital identification cards.

## 📋 Overview

The Ambo University Smart Card Management System is a full-stack web application built with React (frontend) and Node.js/Express (backend) that manages:

- **Student & Employee Registration** - Complete profile management with photo uploads
- **Smart Card Generation** - Digital ID cards with QR codes and barcodes
- **Attendance Tracking** - Real-time check-in/check-out for students and employees
- **Cafeteria Management** - Meal time tracking and attendance reporting
- **Employee Attendance Control** - Role-based attendance management with time windows
- **Reporting & Analytics** - Comprehensive attendance reports and data export

## 🎯 Key Features

### Student Management
- Student registration and profile management
- Photo capture and processing
- Smart card generation with QR codes and barcodes
- Student attendance tracking via QR scanning
- Profile completion tracking

### Employee Management
- Employee registration by department and role
- Employee type categorization (Academic Staff, Administrative Staff, Technical Staff, Support Staff, Security Staff, Management)
- Smart card generation for employees
- Position and campus tracking

### Attendance System
- **Real-Time Check-In/Check-Out** - Accurate timestamp recording
- **Multiple Attendance Types** - Check-In, Check-Out, Break Start, Break End
- **Time Control Management** - Manual and automatic attendance control modes
- **Status Tracking** - Present, Late, Absent, Excused statuses
- **Department Filtering** - View attendance by department and staff type
- **Date Range Filtering** - Generate reports for specific periods
- **CSV Export** - Export attendance records for analysis

### Cafeteria Integration
- Meal time scheduling (Breakfast, Lunch, Dinner)
- Cafeteria attendance tracking
- Duplicate scan prevention
- Meal-specific reporting

### Reports & Analytics
- Attendance summary dashboards
- Staff type-based attendance reports
- Detailed attendance logs with filtering
- CSV export for data analysis
- Attendance rate calculations

## 💻 Technology Stack

### Frontend
- **React** - UI framework
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **QR Code Libraries** - QR/Barcode generation
- **html2canvas & jsPDF** - Card export functionality

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **UUID** - Unique ID generation

### Database
- **MySQL 5.7+** - Relational database
- Multiple tables for students, employees, attendance, cafeteria tracking

## 📁 Project Structure

```
ambo_smart_card_system/
├── ambo_smart_card_backend/
│   ├── backend/
│   │   ├── server.js                 # Express server entry point
│   │   ├── db.js                     # Database connection
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js               # Authentication endpoints
│   │   │   ├── students.js           # Student management
│   │   │   ├── employees.js          # Employee management
│   │   │   ├── attendance.js         # Attendance tracking
│   │   │   ├── cafeteria.js          # Cafeteria management
│   │   │   ├── dashboard.js          # Dashboard data
│   │   │   └── registrations.js      # Registration management
│   │   ├── sql/
│   │   │   ├── employee_attendance_control.sql
│   │   │   └── employee_attendance_control_simple.sql
│   │   └── package.json              # Backend dependencies
│   │
│   ├── ambo_smart_card_frontend/
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   │   ├── Login.js
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── Students.js
│   │   │   │   ├── Employees.js
│   │   │   │   ├── Attendance.js
│   │   │   │   ├── EmployeeAttendanceModule.js
│   │   │   │   ├── CafeteriaAttendanceDashboard.js
│   │   │   │   ├── Reports.js
│   │   │   │   ├── SmartCardGenerator.js
│   │   │   │   └── EmployeeSmartIDUnified.js
│   │   │   ├── context/
│   │   │   │   └── ThemeContext.js   # Theme management
│   │   │   ├── App.js                # Main app component
│   │   │   └── index.js              # React entry point
│   │   ├── public/                   # Static files
│   │   ├── package.json              # Frontend dependencies
│   │   └── build/                    # Production build (generated)
│   │
│   └── package.json
│
├── START_SYSTEM.bat                  # Windows startup script
├── START_SYSTEM.ps1                  # PowerShell startup script
├── RUN_DATABASE_MIGRATION.bat        # Database setup script
├── SETUP_ATTENDANCE_CONTROL.bat      # Attendance system setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14+ and npm
- **MySQL** 5.7 or higher
- **Git** (optional)

### Installation Steps

#### 1. Clone/Extract Project
```bash
# Navigate to project directory
cd ambo_smart_card_system
```

#### 2. Database Setup
```bash
# Run the database migration script (Windows)
RUN_DATABASE_MIGRATION.bat

# OR manually import SQL file into MySQL
mysql -u root -p ambo_smart_card < backend/sql/schema.sql
```

#### 3. Backend Setup
```bash
cd ambo_smart_card_backend/backend

# Install dependencies
npm install

# Create .env file (if needed)
# Configure database connection in db.js

# Start backend server (runs on port 5000)
npm start
```

#### 4. Frontend Setup
```bash
cd ../ambo_smart_card_frontend

# Install dependencies
npm install

# Start development server (runs on port 3000)
npm start
```

#### 5. Access the Application
- Open browser and navigate to: `http://localhost:3000`
- Login with admin credentials

### Using Startup Scripts

**Windows (Batch):**
```bash
START_SYSTEM.bat
```

**PowerShell:**
```powershell
.\START_SYSTEM.ps1
```

## 🔑 Default Credentials

Create initial admin user through the registration system or database seeding script.

## 📊 Core Modules

### 1. Student Management
- Register students with personal details
- Upload and manage student photos
- Generate smart cards with QR codes
- Track attendance through QR scanning

**Routes:**
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### 2. Employee Management
- Register employees by department
- Assign staff type and position
- Generate employee smart cards
- Track employee attendance with time control

**Routes:**
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee

### 3. Attendance Tracking
- Record check-in/check-out times
- Automatic timestamp capture
- Prevent duplicate entries
- Support multiple attendance types

**Routes:**
- `POST /api/attendance/mark` - Mark student attendance
- `POST /api/attendance/mark-employee` - Mark employee attendance
- `GET /api/attendance/employee-types` - Get attendance by staff type
- `GET /api/attendance/student/:studentId` - Get student attendance history
- `GET /api/attendance/employee/:employeeId` - Get employee attendance history

### 4. Attendance Control System
- Open/Close attendance for specific periods
- Manual and automatic control modes
- Time window configuration
- Department-level control

**Routes:**
- `GET /api/employee-attendance-control/status` - Get control status
- `POST /api/employee-attendance-control/manual/open` - Open attendance
- `POST /api/employee-attendance-control/manual/close` - Close attendance
- `PUT /api/employee-attendance-control/configure` - Configure settings

### 5. Cafeteria Management
- Track meal attendance by type
- Prevent duplicate meal scans
- Report on meal-specific attendance
- Time-window based access

**Routes:**
- `GET /api/cafeteria/meal-status` - Get current meal status
- `POST /api/cafeteria/scan` - Record cafeteria scan
- `GET /api/cafeteria/records` - Get cafeteria records
- `GET /api/cafeteria/today-summary` - Get today's summary

### 6. Reports
- Attendance dashboard with charts
- Staff type-based reporting
- Detailed attendance logs
- CSV export functionality

**Routes:**
- `GET /api/detailed-reports` - Get detailed reports
- `GET /api/text-reports` - Get text-based reports
- `GET /api/dashboard` - Get dashboard data

## 📝 Database Schema

### Key Tables
- `users` - User accounts and authentication
- `students` - Student information
- `employees` - Employee information
- `departments` - Department listing
- `attendance` - Attendance records
- `employee_attendance_records` - Employee-specific attendance
- `employee_attendance_control` - Attendance control configuration
- `cafeteria_attendance` - Cafeteria scan records
- `meal_times_config` - Meal time configuration

## 🔐 Authentication

- JWT-based authentication
- Role-based access control (Admin, Staff, Student, Employee)
- Secure password storage with hashing
- Token expiration management

## 🎨 Frontend Features

### User Interface
- Clean, responsive Material-UI design
- Dark/Light theme toggle
- Dashboard with real-time data
- Collapsible navigation
- Mobile-friendly layout

### Components
- Login page with authentication
- Student registration and management
- Employee management interface
- Attendance tracking dashboard
- Smart card preview and export
- Report generation and filtering
- Cafeteria dashboard

## 📋 Attendance Time Tracking

The system accurately records check-in and check-out times:

- **Check-In Time** - Captured at moment of scan (HH:MM:SS format)
- **Check-Out Time** - Captured at moment of logout scan (HH:MM:SS format)
- **Date** - Recorded as YYYY-MM-DD (local timezone)
- **No Duplicates** - Prevents duplicate entries per employee per day
- **Persistent Storage** - Times saved in database, persist after refresh

Example attendance record:
```
Date: 2026-09-05
Check In: 10:34:08
Check Out: 17:05:32
Status: present
```

## 🔧 Configuration

### Database Connection
Edit `backend/db.js` to configure MySQL connection:
```javascript
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'ambo_smart_card'
});
```

### Server Port
Edit `backend/server.js` to change backend port (default: 5000)

### Frontend API URL
Edit `ambo_smart_card_frontend/src/components/` files to update API base URL

## 📊 Reports & Exports

### Available Reports
1. **Daily Attendance Summary** - Total present, late, absent
2. **Department Reports** - Attendance by department
3. **Staff Type Reports** - Attendance by employee type
4. **Detailed Logs** - Complete attendance records with timestamps
5. **Cafeteria Reports** - Meal attendance by type

### Export Options
- **CSV Export** - Standard spreadsheet format
- **PDF Export** - Printable ID cards
- **PNG Export** - Image format for cards

## 🐛 Troubleshooting

### Server Won't Start
- Check MySQL connection in `db.js`
- Ensure port 5000 is not in use
- Verify all npm dependencies are installed

### Frontend Cannot Connect to Backend
- Verify backend is running on port 5000
- Check API URL in frontend components
- Clear browser cache and cookies

### Attendance Records Not Showing
- Ensure attendance control is "OPEN"
- Check that time is within configured window
- Verify employee/student exists in database

### Photos Not Uploading
- Check `uploads/` directory permissions
- Verify multer configuration in server.js
- Ensure file size is within limits

## 📞 Support & Maintenance

### Logs
- Backend logs are output to console
- Database queries logged with timestamps
- Frontend errors visible in browser console

### Backup
- Regularly backup MySQL database
- Export attendance records monthly
- Keep configuration files secure

### Updates
- Check for new attendance time display format
- Verify SQL migrations are applied
- Update npm dependencies periodically

## 📄 License

This project is developed for Ambo University.

## 👥 Contributors

- Development Team
- Ambo University IT Department

---

**Last Updated:** September 2026
**Version:** 2.0
**Status:** Production Ready

For detailed API documentation, see `API.md` or check the individual route files in `backend/routes/`.
