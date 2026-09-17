import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import Reports from "./components/Reports";
import Attendance from "./components/Attendance";
import Students from "./components/Students";
import Cards from "./components/Cards";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import StudentRegistration from "./components/StudentRegistration";
import StudentProfileCompletion from "./components/StudentProfileCompletion";
import HomePage from "./components/HomePage";
import Registrations from "./components/Registrations";
import SmartCards from "./components/SmartCards";
import EditProfile from "./components/EditProfile";
import Employees from "./components/Employees";
import AttendanceModule from "./components/AttendanceModule";
import EmployeeAttendanceModule from "./components/EmployeeAttendanceModule";
import EmployeeAttendanceControl from "./components/EmployeeAttendanceControl";
import CafeteriaAttendanceDashboard from "./components/CafeteriaAttendanceDashboard";
import AdminSettings from "./components/AdminSettings";
import { getToken, getUserRole } from "./auth";

// ===== PROTECTED ROUTE - Requires authentication =====
function ProtectedRoute({ children }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ===== ROLE-BASED ROUTE - Requires specific role =====
function RoleBasedRoute({ children, allowedRoles }) {
  const token = getToken();
  const role = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<StudentRegistration onClose={() => window.location.href = "/"} />} />

        {/* ===== STUDENT PROFILE COMPLETION ===== */}
        <Route path="/complete-profile" element={
          <ProtectedRoute>
            <StudentProfileCompletion />
          </ProtectedRoute>
        } />

        {/* ===== PROTECTED LAYOUT WITH ROLE-BASED ROUTES ===== */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - Accessible to all authenticated users (admin, staff, student) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Edit Profile - Accessible to students */}
          <Route path="/edit-profile" element={
            <RoleBasedRoute allowedRoles={["student"]}>
              <EditProfile />
            </RoleBasedRoute>
          } />

          {/* ADMIN & STAFF ONLY ROUTES */}
          <Route path="/students" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <Students />
            </RoleBasedRoute>
          } />

          <Route path="/registrations" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <Registrations />
            </RoleBasedRoute>
          } />

          <Route path="/cards" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <Cards />
            </RoleBasedRoute>
          } />

          <Route path="/smartcards" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <SmartCards />
            </RoleBasedRoute>
          } />

          <Route path="/attendance" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <Attendance />
            </RoleBasedRoute>
          } />

          <Route path="/attendance-module" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <AttendanceModule />
            </RoleBasedRoute>
          } />

          <Route path="/cafeteria-attendance" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <CafeteriaAttendanceDashboard />
            </RoleBasedRoute>
          } />

          <Route path="/employee-attendance" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <EmployeeAttendanceModule />
            </RoleBasedRoute>
          } />

          <Route path="/employee-attendance-control" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <EmployeeAttendanceControl />
            </RoleBasedRoute>
          } />

          <Route path="/employees" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <Employees />
            </RoleBasedRoute>
          } />

          <Route path="/reports" element={
            <RoleBasedRoute allowedRoles={["admin", "staff"]}>
              <Reports />
            </RoleBasedRoute>
          } />

          <Route path="/admin-settings" element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminSettings />
            </RoleBasedRoute>
          } />
        </Route>

        {/* ===== CATCH ALL - Redirect to home ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
