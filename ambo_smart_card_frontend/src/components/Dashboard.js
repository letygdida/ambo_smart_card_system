import { API_URL } from '../config';

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [role, setRole] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Admin dashboard stats - declare at top level
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCardsIssued: 0,
    pendingRegistrations: 0,
    todayAttendance: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);

    if (userRole === "student") {
      fetchStudentProfile();
      
      // Check if profile was just updated
      const profileUpdated = localStorage.getItem('profileUpdated');
      if (profileUpdated === 'true') {
        console.log('Dashboard: Profile was updated, refreshing...');
        localStorage.removeItem('profileUpdated');
        // Force a fresh fetch
        setTimeout(() => fetchStudentProfile(), 500);
      }
    } else if (userRole === "admin") {
      setLoading(false);
      fetchDashboardStats();
    } else {
      setLoading(false);
    }

    // Also refresh when the page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden && userRole === "student") {
        console.log('Dashboard: Page became visible, refreshing...');
        fetchStudentProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]); // Re-fetch when navigation changes

  const fetchDashboardStats = async () => {
    console.log('?? fetchDashboardStats called');
    const apiUrl = `${API_URL}/api/dashboard/stats?t=${Date.now()}`;
    console.log('?? Calling:', apiUrl);
    
    try {
      const token = localStorage.getItem("token");
      console.log('?? Token:', token ? 'exists' : 'missing');
      
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache"
        }
      });

      console.log('?? Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('?? Received data:', data);
        setStats(data);
      } else {
        console.error('?? Response not OK:', response.status, response.statusText);
        const text = await response.text();
        console.error('?? Response text:', text);
      }
    } catch (err) {
      console.error("? Error fetching dashboard stats:", err);
      console.error("? Error details:", err.message, err.stack);
    } finally {
      console.log('?? Setting statsLoading to false');
      setStatsLoading(false);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log('Dashboard: Fetching profile...');
      
      const response = await fetch(
        `${API_URL}/api/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      console.log('Dashboard: Profile data received:', data);
      setStudentData(data);
    } catch (err) {
      console.error('Dashboard: Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestSmartCard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/registrations/request-card`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setError("");
        fetchStudentProfile(); // Refresh to show new status
      } else {
        setError(data.error);
        setMessage("");
      }
    } catch (err) {
      setError("Failed to request smart card");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // STUDENT DASHBOARD
  if (role === "student") {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Welcome, {studentData?.full_name || localStorage.getItem("username")}!
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setLoading(true);
              fetchStudentProfile();
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Refresh Profile"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  My Profile
                </Typography>
                
                {/* Profile Photo */}
                {studentData?.photo && studentData.photo !== 'default-avatar.svg' ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <img
                      src={`${API_URL}/uploads/registrations/${studentData.photo}`}
                      alt="Profile"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #1976d2'
                      }}
                      onError={(e) => {
                        console.error('Failed to load photo:', studentData.photo);
                        e.target.style.display = 'none';
                      }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      border: '3px solid #1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      color: '#9e9e9e'
                    }}>
                      ??
                    </Box>
                  </Box>
                )}

                <Typography color="textSecondary">
                  Name: <strong>{studentData?.full_name || localStorage.getItem("username")}</strong>
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Student ID: <strong>{studentData?.student_id || localStorage.getItem("student_id") || "Not assigned"}</strong>
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Department: <strong>{studentData?.department || "Not set"}</strong>
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Year: <strong>{studentData?.year ? `Year ${studentData.year}` : "Not set"}</strong>
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Phone: <strong>{studentData?.phone_number || "Not set"}</strong>
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Status: <strong>
                    {studentData?.profile_completed ? "Profile Complete" : "Profile Incomplete"}
                  </strong>
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {!studentData?.profile_completed && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate("/complete-profile")}
                    >
                      Complete Profile
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/edit-profile")}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Quick Links
                </Typography>
                <Typography color="textSecondary">
                  • View your attendance records
                </Typography>
                <Typography color="textSecondary">
                  • Download your card details
                </Typography>
                <Typography color="textSecondary">
                  • Update your profile information
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ADMIN DASHBOARD
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Total Students</Typography>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="h5">{stats.totalStudents.toLocaleString()}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Total Cards Issued</Typography>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="h5">{stats.totalCardsIssued.toLocaleString()}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Pending Registrations</Typography>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="h5">{stats.pendingRegistrations.toLocaleString()}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Today's Attendance</Typography>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="h5">{stats.todayAttendance.toLocaleString()}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

