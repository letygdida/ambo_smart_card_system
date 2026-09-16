# Complete Setup Guide - Ambo Smart Card System
## For New Computer with Only VS Code Installed

This guide walks you through setting up the entire project from scratch on a fresh computer with only VS Code.

---

## 📋 Step 1: Install Required Software

### 1.1 Install Node.js (includes npm)
Node.js is required to run both the backend server and frontend development server.

**Steps:**
1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Run the installer
4. Follow installation wizard (accept defaults)
5. **Restart your computer** after installation

**Verify Installation:**
Open Terminal/PowerShell and run:
```bash
node --version
npm --version
```

You should see version numbers (e.g., v18.17.0, 8.19.2)

---

### 1.2 Install MySQL Server
MySQL is the database that stores all your data.

**Steps:**
1. Go to https://www.mysql.com/downloads/mysql/
2. Download **MySQL Community Server** (latest version)
3. Run the installer
4. Choose **Developer Default** setup type
5. Keep default configuration
6. When prompted for MySQL Server setup:
   - **Port:** 3306 (default)
   - **MySQL Server as Windows Service:** YES (check this)
   - **Service Name:** MySQL80 (or default)
7. Configure MySQL Server:
   - Choose **Standalone MySQL Server**
   - Use default networking options
8. MySQL Shell Configuration (skip if not needed)
9. Account & Roles:
   - **Root Account Password:** Set a password you'll remember
   - Example: `root123`
10. Apply Configuration and complete installation

**Verify Installation:**
Open PowerShell and run:
```bash
mysql --version
```

---

## 📁 Step 2: Prepare Project Files

### 2.1 Extract Project
1. Copy the `ambo_smart_card_system` folder to a convenient location
   - Example: `C:\Projects\ambo_smart_card_system`
2. Open this folder in VS Code

### 2.2 Open Project in VS Code
1. Open VS Code
2. File → Open Folder
3. Select `ambo_smart_card_system` folder
4. Click Select Folder

---

## 🗄️ Step 3: Create and Setup Database

### 3.1 Create Database

Open VS Code Terminal (Ctrl + `):

```bash
# Login to MySQL
mysql -u root -p

# When prompted, enter your root password (e.g., root123)
```

In MySQL prompt, run:
```sql
CREATE DATABASE ambo_smart_card;
USE ambo_smart_card;
```

### 3.2 Import Database Schema

Still in MySQL prompt:
```sql
SOURCE backend/sql/employee_attendance_control_simple.sql;
```

Or if that file doesn't exist, create tables manually:
```sql
-- Run the SQL schema file from your project
-- You can also find complete SQL files in the project root folder
```

**Alternative Method - Using SQL File:**

1. Find the complete SQL file in project root (e.g., `ambo_smart_card_complete.sql`)
2. In MySQL prompt:
```sql
SOURCE ambo_smart_card_complete.sql;
```

**Exit MySQL:**
```bash
EXIT;
```

---

## ⚙️ Step 4: Backend Setup

### 4.1 Navigate to Backend

In VS Code Terminal:
```bash
cd ambo_smart_card_backend/backend
```

### 4.2 Update Database Configuration

1. Open `db.js` file in VS Code
2. Update the connection details to match your MySQL setup:

```javascript
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123',        // Your MySQL password
  database: 'ambo_smart_card'
});
```

### 4.3 Install Dependencies

```bash
npm install
```

This will download and install all required packages (takes 2-3 minutes)

### 4.4 Create Uploads Folder

```bash
mkdir uploads
```

This folder stores uploaded photos and files.

### 4.5 Start Backend Server

```bash
npm start
```

**Expected Output:**
```
Server running on port 5000
Connected to database
```

**Keep this terminal open!** The backend must run continuously.

---

## 🎨 Step 5: Frontend Setup

### 5.1 Open New Terminal

In VS Code, click the **+** icon next to the terminal to open a new terminal window.

### 5.2 Navigate to Frontend

```bash
cd ambo_smart_card_backend/ambo_smart_card_frontend
```

### 5.3 Install Dependencies

```bash
npm install
```

This will download React and all frontend packages (takes 3-5 minutes).

### 5.4 Start Frontend Server

```bash
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view ambo_smart_card_frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.x.x.x:3000
```

A browser window should automatically open to `http://localhost:3000`

---

## ✅ Step 6: Access the Application

### 6.1 Login

If browser didn't open automatically:
1. Open your web browser
2. Go to `http://localhost:3000`
3. You should see the login page

### 6.2 Create Admin Account

If first time:
1. Look for "Register" or "Sign Up" link
2. Create an admin account with credentials:
   - **Username:** admin
   - **Password:** admin123
   - **Email:** admin@ambo.edu.et

### 6.3 Login to Dashboard

1. Enter credentials
2. Click Login
3. You should see the main dashboard

---

## 🚀 Running the Project (Daily Use)

Once setup is complete, to run the project each day:

### Method 1: Using VS Code

1. Open VS Code
2. Open the project folder
3. Open Terminal (Ctrl + `)
4. Split terminal into two panes:
   - **Terminal 1 - Backend:**
     ```bash
     cd ambo_smart_card_backend/backend
     npm start
     ```
   - **Terminal 2 - Frontend:**
     ```bash
     cd ambo_smart_card_backend/ambo_smart_card_frontend
     npm start
     ```

### Method 2: Using Batch Files (Windows)

Double-click in project folder:
- `START_SYSTEM.bat` - Starts both backend and frontend automatically

### Method 3: Using PowerShell Script (Windows)

Open PowerShell in project folder and run:
```bash
.\START_SYSTEM.ps1
```

---

## 📊 Terminal Management

### Running Both Servers

You need BOTH servers running simultaneously:

**Terminal Layout:**
```
┌─────────────────────────────────┐
│ VS Code                         │
├──────────────┬──────────────────┤
│ Backend      │ Frontend         │
│ npm start    │ npm start        │
│ Port 5000    │ Port 3000        │
└──────────────┴──────────────────┘
```

### Split Terminal in VS Code

1. In terminal, click the **split** icon (or press Ctrl + \)
2. In left terminal: `cd ambo_smart_card_backend/backend && npm start`
3. In right terminal: `cd ambo_smart_card_backend/ambo_smart_card_frontend && npm start`

---

## 🔍 Troubleshooting

### Issue: "npm command not found"
**Solution:** Node.js not installed or not in PATH
- Restart computer after installing Node.js
- Verify: `node --version`

### Issue: "MySQL Server not running"
**Solution:** Start MySQL Service
- Windows: Services → MySQL80 → Start
- Or: `net start MySQL80` (in PowerShell as Admin)

### Issue: "Cannot connect to database"
**Solution:** Check db.js configuration
1. Verify username and password in `backend/db.js`
2. Verify database name: `ambo_smart_card`
3. Verify MySQL is running: `mysql -u root -p`

### Issue: "Port 3000 or 5000 already in use"
**Solution:** Kill process using the port
```bash
# For Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or change port in server.js or package.json
```

### Issue: Frontend cannot reach backend
**Solution:** Ensure backend is running
1. Check backend terminal shows "Server running on port 5000"
2. Check `http://localhost:5000` in browser (should show error or API response)
3. Restart backend: Ctrl+C then `npm start`

### Issue: Dependencies won't install
**Solution:** Clear npm cache
```bash
npm cache clean --force
npm install
```

### Issue: Blank screen or errors on login
**Solution:** 
1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab to see if requests reach backend
4. Restart both servers

---

## 📝 Database Connection String Reference

If you need to connect from other tools:

```
mysql -u root -p -h localhost ambo_smart_card
```

Connection Details:
- **Host:** localhost
- **Port:** 3306 (default)
- **User:** root
- **Password:** [Your MySQL Password]
- **Database:** ambo_smart_card

---

## 🔑 Default Login Credentials

After first-time setup:
- **Username:** admin
- **Password:** admin123
- **Email:** admin@ambo.edu.et

(Create your own after first login)

---

## 📱 Accessing from Mobile/Other Computers

To access from another computer on same network:

1. Find your computer's IP address:
   ```bash
   ipconfig
   # Look for "IPv4 Address" under your network adapter
   # Example: 192.168.1.100
   ```

2. On other computer, open browser and go to:
   ```
   http://192.168.1.100:3000
   ```

---

## 🛑 Stopping the Servers

**Gracefully stop:**
- In each terminal, press `Ctrl + C`
- Confirm with `Y` if prompted

**Restart:**
- Just run `npm start` again in each terminal

---

## 📚 File Structure Quick Reference

```
ambo_smart_card_system/
├── ambo_smart_card_backend/
│   ├── backend/              ← Backend code here
│   │   ├── db.js             ← Edit MySQL config here
│   │   └── server.js         ← Main backend file
│   ├── ambo_smart_card_frontend/  ← Frontend code here
│   │   └── package.json      ← Frontend dependencies
│   └── package.json          ← Backend dependencies
├── README.md                 ← Main documentation
└── SETUP_GUIDE.md           ← This file
```

---

## ✨ Next Steps

After successful setup:

1. **Explore Dashboard** - Familiarize with UI
2. **Add Students** - Create test student records
3. **Add Employees** - Create test employee records
4. **Test Attendance** - Test check-in/check-out functionality
5. **Generate Reports** - View attendance reports
6. **Export Data** - Export to CSV

---

## 🎯 Common Tasks

### Restart Everything Fresh
```bash
# Terminal 1 - Stop backend
# Press Ctrl+C

# Terminal 2 - Stop frontend  
# Press Ctrl+C

# Then restart both
cd ambo_smart_card_backend/backend && npm start
cd ambo_smart_card_backend/ambo_smart_card_frontend && npm start
```

### Reset Database
```sql
-- In MySQL prompt
DROP DATABASE ambo_smart_card;
CREATE DATABASE ambo_smart_card;
SOURCE ambo_smart_card_complete.sql;
```

### View Database
```bash
# In terminal
mysql -u root -p ambo_smart_card
SHOW TABLES;
SELECT COUNT(*) FROM students;
EXIT;
```

### Check if Ports are Open
```bash
# PowerShell
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -eq 3000 -or $_.LocalPort -eq 5000}
```

---

## 📞 Quick Support

| Issue | Solution |
|-------|----------|
| Nothing works | Restart computer, then restart servers |
| Database error | Check MySQL running: `mysql -u root -p` |
| Frontend blank | Check browser console (F12) for errors |
| Backend won't start | Check port 5000 not in use |
| npm install slow | Check internet connection |

---

## 🎓 Learning Resources

- Node.js: https://nodejs.org/docs/
- React: https://react.dev/
- MySQL: https://dev.mysql.com/doc/
- Express: https://expressjs.com/
- Postman (test API): https://www.postman.com/

---

**Version:** 2.0
**Last Updated:** September 2026
**Status:** Production Ready

For questions or issues, refer to the main README.md file or check individual component documentation.
