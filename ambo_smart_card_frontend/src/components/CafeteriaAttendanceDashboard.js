import { API_URL } from '../config';
import { safeFetch, getToken, clearSession, getUserRole } from '../auth';

import React, { useEffect, useState, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  CreditCard as SmartCardIcon,
  Fastfood as FastfoodIcon,
  CameraAlt as CameraIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Safe JSON fetch is now imported from auth.js for centralized 401 handling

// Get remaining time until meal closes
const getRemainingTime = (endTime) => {
  const now = new Date();
  const [endHour, endMin] = endTime.split(':').map(Number);
  const closeTime = new Date();
  closeTime.setHours(endHour, endMin, 0, 0);
  
  const diff = closeTime - now;
  if (diff <= 0) return 'Closed';
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m remaining`;
};

// Get time until next meal starts
const getTimeUntilNextMeal = (mealStatus) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const mealTimes = {
    breakfast: 6 * 60,   // 06:00
    lunch: 12 * 60,      // 12:00
    dinner: 17 * 60      // 17:00
  };
  
  let nextMeal = null;
  let minDiff = Infinity;
  
  Object.entries(mealTimes).forEach(([meal, time]) => {
    const diff = time - currentMinutes;
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextMeal = meal;
    }
  });
  
  if (nextMeal && minDiff < Infinity) {
    const hours = Math.floor(minDiff / 60);
    const minutes = minDiff % 60;
    return `${hours}h ${minutes}m until ${nextMeal}`;
  }
  
  return 'Next meal time unknown';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function CafeteriaAttendanceDashboard() {
  const [mealStatus, setMealStatus] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Scanner states
  const [scanStudentId, setScanStudentId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');
  
  // Meal selection (for manual scanning)
  const [selectedMealType, setSelectedMealType] = useState('breakfast');

  const token = getToken();
  const userRole = getUserRole();

  // Check authorization
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (userRole !== 'admin' && userRole !== 'staff') {
      setError('You do not have permission to access the Cafeteria Attendance Dashboard');
      setLoading(false);
      return;
    }

    // Initial data fetch
    fetchMealStatus();
    fetchTodaySummary();
    fetchRecords();

    // Refresh every minute
    const interval = setInterval(() => {
      fetchMealStatus();
      fetchTodaySummary();
    }, 60000);

    return () => clearInterval(interval);
  }, [token, userRole, navigate]);

  // Fetch meal status from backend
  const fetchMealStatus = async () => {
    const result = await safeFetch(`${API_URL}/api/cafeteria/meal-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (result.success) {
      setMealStatus(result.data);
      // If no meal selected and one is open, auto-select it
      if (!selectedMealType && result.data.mealStatus) {
        const openMeal = Object.entries(result.data.mealStatus)
          .find(([_, meal]) => meal.is_open)?.[0];
        if (openMeal) setSelectedMealType(openMeal);
      }
      setError(null);
    } else {
      console.error('Failed to fetch meal status:', result.error);
      // Set default status if API fails
      setMealStatus({
        success: true,
        currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        mealStatus: {
          breakfast: { start_time: '06:00', end_time: '08:00', is_open: false, control_mode: 'auto' },
          lunch: { start_time: '12:00', end_time: '14:00', is_open: false, control_mode: 'auto' },
          dinner: { start_time: '17:00', end_time: '19:00', is_open: false, control_mode: 'auto' }
        }
      });
    }
  };

  // Fetch today's summary
  const fetchTodaySummary = async () => {
    const result = await safeFetch(`${API_URL}/api/cafeteria/today-summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (result.success) {
      setTodaySummary(result.data);
    }
  };

  // Fetch records
  const fetchRecords = async () => {
    const result = await safeFetch(`${API_URL}/api/cafeteria/records?page=1&limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (result.success) {
      setRecords(result.data.records || []);
    }
  };

  // Scan student (called by camera or manual)
  const handleScan = async () => {
    const studentId = manualInput.trim() || scanStudentId.trim();
    
    if (!studentId) {
      setMessage('?? Please enter or scan a student ID');
      return;
    }

    // Check if cafeteria is open
    if (mealStatus?.mealStatus) {
      const anyOpen = Object.values(mealStatus.mealStatus).some(m => m.is_open);
      if (!anyOpen) {
        setMessage('?? Cafeteria is CLOSED - Cannot process scan');
        return;
      }
    }

    setScanning(true);
    setMessage('');

    try {
      const url = `${API_URL}/api/cafeteria/scan`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: studentId,
          scannerId: 'CAFT-SCANNER-001',
          verificationMethod: manualInput ? 'manual_entry' : 'camera_scan',
          mealType: manualInput ? selectedMealType : null // Only for manual entry
        })
      });

      const contentType = response.headers.get('content-type');
      let data = {};
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (response.ok) {
        setMessage(`? ${data.message || 'Attendance recorded successfully!'}`);
        setManualInput('');
        setScanStudentId('');
        setShowCameraScanner(false);
        setTimeout(() => {
          fetchTodaySummary();
          fetchRecords();
          fetchMealStatus();
        }, 1000);
      } else {
        // Handle different error types
        if (response.status === 403) {
          setMessage(`?? ${data.message || 'Cafeteria is closed'}`);
        } else if (response.status === 400) {
          setMessage(`?? ${data.message || 'Invalid request'}`);
        } else if (response.status === 404) {
          setMessage(`? Student not found: ${studentId}`);
        } else {
          setMessage(`? ${data.error || 'Scan failed'}`);
        }
      }
    } catch (err) {
      setMessage(`? Error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Manual meal selection
  const handleMealSelect = (mealType) => {
    setSelectedMealType(mealType);
    // Update manual input placeholder based on selected meal
  };

  // Meal control function
  const handleMealControl = async (mealType, action) => {
    const token = getToken();
    if (!token) {
      setMessage('Session expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/login';
      return;
    }
    
    try {
      setMessage(`Updating ${mealType}...`);
      
      const response = await fetch(`${API_URL}/api/cafeteria/control/${mealType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`? ${data.error || 'Failed to update meal status'}`);
        return;
      }

      setMessage(`? ${data.message}`);
      // Refresh meal status
      setTimeout(() => {
        fetchMealStatus();
      }, 1000);
    } catch (err) {
      setMessage(`? Error: ${err.message}`);
      console.error('Meal control error:', err);
    }
  };

  // Render meal status card
  const renderMealCard = (mealType, meal) => {
    const isCurrent = mealStatus?.currentMeal === mealType;
    const cardColor = isCurrent ? '#e8f5e9' : (meal.is_open ? '#fff3e0' : '#f5f5f5');
    const borderColor = isCurrent ? '#4caf50' : (meal.is_open ? '#ff9800' : '#9e9e9e');
    const iconColor = isCurrent ? '#4caf50' : (meal.is_open ? '#ff9800' : '#9e9e9e');

    return (
      <Card 
        key={mealType} 
        sx={{ 
          mb: 2,
          bgcolor: cardColor,
          borderLeft: `4px solid ${borderColor}`,
          boxShadow: isCurrent ? 3 : 1
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={2} sx={{ textAlign: 'center' }}>
              <FastfoodIcon sx={{ fontSize: 40, color: iconColor }} />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1, textTransform: 'capitalize' }}>
                {mealType}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {meal.is_open ? (
                    <span style={{ color: '#4caf50' }}>
                      ? OPEN - {meal.control_mode === 'manually_opened' ? 'Manually Opened' : 'Auto'}
                    </span>
                  ) : (
                    <span style={{ color: '#f44336' }}>
                      ?? CLOSED - {meal.control_mode === 'manually_closed' ? 'Manually Closed' : 'Auto'}
                    </span>
                  )}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                ? {meal.start_time} - {meal.end_time}
              </Typography>
              
              <Typography variant="body2" color="textSecondary">
                {meal.is_open ? (
                  <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {getRemainingTime(meal.end_time)}
                  </span>
                ) : (
                  <span style={{ color: '#9e9e9e' }}>
                    {getTimeUntilNextMeal(mealStatus?.mealStatus)}
                  </span>
                )}
              </Typography>
              
              {isCurrent && meal.is_open && (
                <Typography variant="body2" color="#4caf50" fontWeight="bold">
                  ?? CURRENT MEAL
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              {/* Open/Close Buttons */}
              <Box sx={{ mb: 1 }}>
                <Button
                  variant={meal.is_open ? 'outlined' : 'contained'}
                  color={meal.is_open ? 'warning' : 'success'}
                  size="small"
                  onClick={() => handleMealControl(mealType, 'open')}
                  disabled={meal.manual_status === 'open'}
                  sx={{ mr: 0.5 }}
                >
                  Open
                </Button>
                <Button
                  variant={!meal.is_open ? 'outlined' : 'contained'}
                  color={!meal.is_open ? 'warning' : 'error'}
                  size="small"
                  onClick={() => handleMealControl(mealType, 'close')}
                  disabled={meal.manual_status === 'close'}
                  sx={{ ml: 0.5 }}
                >
                  Close
                </Button>
              </Box>
              
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                Daily Limit
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="textPrimary">
                {meal.daily_limit || '8'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                per student
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render scanner section
  const renderScannerSection = () => (
    <Card sx={{ mb: 3, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          ?? Smart Card Scanner
        </Typography>

        {/* Meal Selection for Manual Entry */}
        {!showCameraScanner && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              ??? Select Meal Type
            </Typography>
            <Grid container spacing={1}>
              {['breakfast', 'lunch', 'dinner'].map((meal) => (
                <Grid item xs={4} key={meal}>
                  <Button
                    variant={selectedMealType === meal ? 'contained' : 'outlined'}
                    color={selectedMealType === meal ? 'primary' : 'inherit'}
                    fullWidth
                    onClick={() => handleMealSelect(meal)}
                    disabled={!mealStatus?.mealStatus?.[meal]?.is_open && mealStatus?.mealStatus?.[meal]?.manual_status !== 'open'}
                  >
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </Button>
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Selected: <strong>{selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}</strong>
            </Typography>
          </Box>
        )}

        {/* QR Camera Scanner */}
        {showCameraScanner && (
          <Box sx={{ mb: 2 }}>
            <Scanner
              onScan={(results) => {
                if (results && results[0]?.rawValue) {
                  try {
                    const data = JSON.parse(results[0].rawValue);
                    if (data.studentId) {
                      setScanStudentId(data.studentId);
                      setMessage(`? QR Code detected: ${data.studentId}`);
                    } else {
                      setScanStudentId(results[0].rawValue);
                      setMessage(`? Code detected: ${results[0].rawValue}`);
                    }
                    setTimeout(() => handleScan(), 500);
                  } catch (e) {
                    setScanStudentId(results[0].rawValue);
                    setMessage(`? Barcode detected: ${results[0].rawValue}`);
                    setTimeout(() => handleScan(), 500);
                  }
                  setShowCameraScanner(false);
                }
              }}
              onError={(error) => {
                setCameraError(`Camera error: ${error?.message || 'Unable to access camera'}`);
              }}
              constraints={{
                video: {
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  facingMode: 'environment'
                }
              }}
              styles={{
                container: { width: '100%', maxWidth: '500px', margin: '0 auto' },
                video: { width: '100%', height: 'auto', borderRadius: '8px' }
              }}
              scanDelay={500}
              allowMultiple={false}
            />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              Position QR code or barcode in the camera view
            </Typography>
          </Box>
        )}

        {/* Manual Entry Form */}
        {!showCameraScanner && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              ?? Manual Student ID Entry
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter student ID (e.g., 2026-1234)"
                  variant="outlined"
                  size="small"
                  disabled={scanning}
                />
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SmartCardIcon />}
                  onClick={handleScan}
                  disabled={scanning || !manualInput.trim()}
                >
                  {scanning ? 'Scanning...' : 'Scan ID'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant={showCameraScanner ? 'contained' : 'outlined'}
            color="secondary"
            startIcon={<CameraIcon />}
            onClick={() => setShowCameraScanner(!showCameraScanner)}
            disabled={scanning}
          >
            {showCameraScanner ? 'Stop Camera' : '?? Use Camera'}
          </Button>
          
          <Button
            variant="outlined"
            color="info"
            startIcon={<QrCodeIcon />}
            onClick={() => {
              if (manualInput) {
                handleScan();
              } else {
                setMessage('?? Enter a student ID first or use camera');
              }
            }}
            disabled={scanning}
          >
            Manual Scan
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Render summary cards
  const renderSummaryCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <Card sx={{ height: '100%', textAlign: 'center', bgcolor: '#e8f5e9' }}>
          <CardContent>
            <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {todaySummary?.summary?.totalAttendance || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Today's Attendance
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <Card sx={{ height: '100%', textAlign: 'center', bgcolor: '#fff3e0' }}>
          <CardContent>
            <ErrorIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {todaySummary?.summary?.totalRejected || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Rejected Scans
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <Card sx={{ height: '100%', textAlign: 'center', bgcolor: '#e3f2fd' }}>
          <CardContent>
            <SmartCardIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="primary">
              {todaySummary?.summary?.totalScans || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Scans
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Render records table
  const renderRecordsTable = () => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          ?? Recent Attendance Records
        </Typography>
        
        {loading && records.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>Loading records...</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Meal</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.attendance_id} hover>
                    <TableCell>{record.student_id || 'N/A'}</TableCell>
                    <TableCell>{record.student_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={record.meal_type || 'N/A'} 
                        size="small"
                        color={record.meal_type === 'blocked' ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{record.attendance_date || 'N/A'}</TableCell>
                    <TableCell>{record.scan_time || 'N/A'}</TableCell>
                    <TableCell>
                      {record.attendance_status === 'attended' ? (
                        <Chip label="Present" size="small" color="success" icon={<CheckCircleIcon />} />
                      ) : record.attendance_status === 'rejected_blocked_student' ? (
                        <Chip label="Blocked" size="small" color="error" icon={<LockIcon />} />
                      ) : (
                        <Chip label="Rejected" size="small" color="warning" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  // Main render
  if (loading && !mealStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          ??? Cafeteria Attendance
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {mealStatus?.currentTime ? `Current Time: ${mealStatus.currentTime}` : ''}
        </Typography>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {message && (
        <Alert 
          severity={message.includes('?') ? 'success' : message.includes('??') ? 'warning' : 'error'} 
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Meal Status Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
          ?? Meal Status & Times
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(mealStatus?.mealStatus || {}).map(([mealType, meal]) => (
            <Grid item xs={12} md={4} key={mealType}>
              {renderMealCard(mealType, meal)}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Scanner Section */}
      {renderScannerSection()}

      {/* Recent Records */}
      {renderRecordsTable()}

      {/* Footer Info */}
      <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          ?? Attendance can only be recorded when cafeteria is open. <br/>
          Contact IT support if you encounter scanning issues.
        </Typography>
      </Box>
    </Box>
  );
}

export default CafeteriaAttendanceDashboard;
