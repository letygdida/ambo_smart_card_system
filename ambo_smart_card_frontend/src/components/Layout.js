import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";

import {
  IconButton,
  Button,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  Typography
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BadgeIcon from "@mui/icons-material/Badge";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import EventNoteIcon from "@mui/icons-material/EventNote";
import SettingsIcon from "@mui/icons-material/Settings";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { ThemeContext } from "../context/ThemeContext";

function Layout() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const username = localStorage.getItem("username");

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("student_id");
    localStorage.removeItem("profileCompleted");
    navigate("/login");
  };

  // Admin/Staff Menu
  const adminMenuItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { label: "Students", icon: <PeopleIcon />, path: "/students" },
    { label: "Employees", icon: <WorkIcon />, path: "/employees" },
    { label: "Registrations", icon: <FactCheckIcon />, path: "/registrations" },
    { label: "Smart Cards", icon: <CreditCardIcon />, path: "/smartcards" },
    { label: "Student Attendance", icon: <BadgeIcon />, path: "/attendance-module" },
    { label: "Cafeteria Attendance", icon: <EventNoteIcon />, path: "/cafeteria-attendance" },
    { label: "Employee Attendance", icon: <EventNoteIcon />, path: "/employee-attendance" },
    { label: "Attendance Control", icon: <SettingsIcon />, path: "/employee-attendance-control" },
    { label: "Reports", icon: <AssessmentIcon />, path: "/reports" },
    { label: "Settings", icon: <SettingsIcon />, path: "/admin-settings" }
  ];

  // Student Menu
  const studentMenuItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { label: "My Card", icon: <CreditCardIcon />, path: "/dashboard" },
    { label: "My Profile", icon: <PersonIcon />, path: "/edit-profile" }
  ];

  const menuItems = role === "student" ? studentMenuItems : adminMenuItems;

  return (
    <Box sx={{ display: "flex" }}>
      {/* APP BAR */}
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: isDarkMode ? '#1a1a1a' : '#667eea' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setOpen(!open)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* University Logo */}
          <Box
            component="img"
            src="/images/ambo-university-logo.png"
            alt="Ambo University"
            sx={{
              height: 40,
              width: 'auto',
              objectFit: 'contain',
              mr: 2
            }}
          />

          <Typography variant="h6" sx={{ flexGrow: 1, color: '#ffffff' }}>
            Smart Card Management System
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{ mr: 1 }}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#667eea" }}>
              {username ? username.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>{username}</Typography>
            <Button
              color="inherit"
              size="small"
              onClick={logout}
              startIcon={<LogoutIcon />}
              sx={{ color: '#ffffff' }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR DRAWER */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            marginTop: "64px",
            width: 250,
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: isDarkMode ? '#ffffff' : '#000000' }}>
            {role === "student" ? "Student Menu" : role === "admin" ? "Admin Menu" : "Staff Menu"}
          </Typography>
          <Divider />
        </Box>

        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => setOpen(false)}
              sx={{
                "&:hover": {
                  backgroundColor: isDarkMode ? '#333333' : '#f5f5f5'
                },
                color: isDarkMode ? '#ffffff' : '#000000'
              }}
            >
              <ListItemIcon sx={{ color: isDarkMode ? '#ffffff' : 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
          minHeight: "100vh",
          transition: 'background-color 0.3s ease'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
