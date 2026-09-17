import { API_URL } from '../config';
import { getToken } from '../auth';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function AttendanceModule() {
  const [tabValue, setTabValue] = useState(0);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentId, setStudentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [correctionDialog, setCorrectionDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [summary, setSummary] = useState({});
  const [liveActivity, setLiveActivity] = useState([]);
  const [markStudentId, setMarkStudentId] = useState('');
  const [markedStudent, setMarkedStudent] = useState(null);
  const token = getToken().getItem('token');

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    fetch(`${API_URL}/api/attendance?attendance_date=${today}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAttendance(data.attendance || []);
        setLiveActivity(data.attendance?.reverse() || []);
        setError('');
      })
      .catch(err => {
        setError('Failed to fetch attendance');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const markAttendance = async () => {
    if (!markStudentId) {
      setError('Please enter a student ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const res = await fetch(`${API_URL}/api/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: markStudentId })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to mark attendance');
        setMarkedStudent(null);
        setLoading(false);
        return;
      }

      setSuccess(data.message);
      setMarkedStudent(data.student);
      setMarkStudentId('');
      setLoading(false);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Mark attendance error:', err);
      setMarkedStudent(null);
      setLoading(false);
    }
  };

  const fetchStudentAttendance = () => {
    if (!studentId) {
      setError('Please enter a student ID');
      return;
    }

    setLoading(true);
    // Properly encode the student ID in case it contains special characters
    const encodedStudentId = encodeURIComponent(studentId);
    let url = `${API_URL}/api/attendance/student/${encodedStudentId}`;
    if (startDate) url += `?startDate=${startDate}`;
    if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;

    console.log('Fetching student attendance from:', url);

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setAttendance(data.attendance || []);
        setSummary(data.summary || {});
        setError('');
        if (data.attendance && data.attendance.length === 0) {
          console.warn('No attendance records found for student:', studentId);
        }
      })
      .catch(err => {
        setError(`Failed to fetch student attendance: ${err.message}`);
        console.error('Student attendance fetch error:', err);
      })
      .finally(() => setLoading(false));
  };

  const fetchEmployeeAttendance = () => {
    if (!employeeId) {
      setError('Please enter an employee ID');
      return;
    }

    setLoading(true);
    // Properly encode the employee ID in case it contains special characters
    const encodedEmployeeId = encodeURIComponent(employeeId);
    let url = `${API_URL}/api/attendance/employee/${encodedEmployeeId}`;
    if (startDate) url += `?startDate=${startDate}`;
    if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;

    console.log('Fetching employee attendance from:', url);

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setAttendance(data.attendance || []);
        setSummary(data.summary || {});
        setError('');
        if (data.attendance && data.attendance.length === 0) {
          console.warn('No attendance records found for employee:', employeeId);
        }
      })
      .catch(err => {
        setError(`Failed to fetch employee attendance: ${err.message}`);
        console.error('Employee attendance fetch error:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleCorrectAttendance = async () => {
    if (!selectedAttendance || !newStatus || !correctionReason) {
      setError('Please fill all correction fields');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/attendance/manual-correction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attendanceId: selectedAttendance.attendance_id,
          newStatus: newStatus,
          reason: correctionReason
        })
      });

      if (!res.ok) throw new Error('Failed to correct attendance');

      alert('Attendance corrected successfully');
      setCorrectionDialog(false);
      setNewStatus('');
      setCorrectionReason('');
      setSelectedAttendance(null);
      
      // Refresh appropriate data
      if (studentId) {
        fetchStudentAttendance();
      } else if (employeeId) {
        fetchEmployeeAttendance();
      } else {
        fetchTodayAttendance();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date from database format to YYYY-MM-DD
  const formatAttendanceDate = (dateValue) => {
    if (!dateValue) return '-';
    
    // If it's already in YYYY-MM-DD format, return as-is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's an ISO timestamp, extract and convert to local date
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      try {
        const date = new Date(dateValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return dateValue;
      }
    }
    
    return dateValue;
  };

  // Helper function to ensure time is in HH:MM:SS format
  const formatAttendanceTime = (timeValue) => {
    if (!timeValue) return '-';
    
    // If it's already in HH:MM:SS format, return as-is
    if (typeof timeValue === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
      return timeValue;
    }
    
    // If it's an ISO timestamp, extract the time part
    if (typeof timeValue === 'string' && timeValue.includes('T')) {
      try {
        const date = new Date(timeValue);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      } catch (e) {
        return timeValue;
      }
    }
    
    return timeValue;
  };

  const getStatusColor = (status) => {
    const colors = {
      'present': 'success',
      'late': 'warning',
      'absent': 'error',
      'excused': 'info',
      'checked_in': 'primary',
      'checked_out': 'secondary'
    };
    return colors[status] || 'default';
  };

  const renderAttendanceTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ background: '#f5f5f5' }}>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Person Name</TableCell>
            <TableCell>Check In</TableCell>
            <TableCell>Check Out</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : attendance.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                No attendance records found
              </TableCell>
            </TableRow>
          ) : (
            attendance.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell>{formatAttendanceDate(rec.attendance_date)}</TableCell>
                <TableCell>{rec.person_name}</TableCell>
                <TableCell>{formatAttendanceTime(rec.check_in_time)}</TableCell>
                <TableCell>{formatAttendanceTime(rec.check_out_time)}</TableCell>
                <TableCell>
                  <Chip
                    label={rec.attendance_status}
                    color={getStatusColor(rec.attendance_status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{rec.location || '-'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedAttendance(rec);
                      setCorrectionDialog(true);
                    }}
                  >
                    Correct
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderSummary = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary">Total Sessions</Typography>
            <Typography variant="h5">{summary.totalSessions || summary.totalDays || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary">Present</Typography>
            <Typography variant="h5" sx={{ color: 'green' }}>{summary.present || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary">Late</Typography>
            <Typography variant="h5" sx={{ color: 'orange' }}>{summary.late || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary">Absence Rate</Typography>
            <Typography variant="h5" sx={{ color: 'red' }}>{summary.absent || 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Attendance Management & Reporting
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ mb: 3 }}>
        <Tab label="Mark Attendance" />
        <Tab label="Today's Attendance" />
        <Tab label="Student Attendance" />
        <Tab label="Employee Attendance" />
        <Tab label="Live Activity" />
      </Tabs>

      {/* Tab 0: Mark Attendance */}
      {tabValue === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                ?? Mark Attendance by Student ID
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Student ID"
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
                  placeholder="e.g., 2026-5000 (YYYY-####)"
                  helperText="Format: Year-RandomNumber (e.g., 2026-5000)"
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  color="success"
                  onClick={markAttendance}
                  disabled={loading || !markStudentId}
                  sx={{ mt: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Mark Attendance'}
                </Button>
              </Box>

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>? {success}</strong>
                  </Typography>
                  {markedStudent && (
                    <Box sx={{ mt: 1 }}>
                      {markedStudent.full_name && (
                        <Typography variant="body2">
                          <strong>Name:</strong> {markedStudent.full_name}
                        </Typography>
                      )}
                      {markedStudent.name && (
                        <Typography variant="body2">
                          <strong>Name:</strong> {markedStudent.name}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Student ID:</strong> {markedStudent.student_id}
                      </Typography>
                      {markedStudent.department && (
                        <Typography variant="body2">
                          <strong>Department:</strong> {markedStudent.department}
                        </Typography>
                      )}
                      {markedStudent.year && (
                        <Typography variant="body2">
                          <strong>Year:</strong> {markedStudent.year}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 1: Today's Attendance */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={fetchTodayAttendance}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          {renderAttendanceTable()}
        </Box>
      )}

      {/* Tab 2: Student Attendance */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., 2026-5000 (YYYY-####)"
              helperText="Format: Year-RandomNumber (e.g., 2026-5000)"
            />
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={fetchStudentAttendance}
              disabled={loading || !studentId}
            >
              Search
            </Button>
          </Box>
          {Object.keys(summary).length > 0 && renderSummary()}
          {renderAttendanceTable()}
        </Box>
      )}

      {/* Tab 3: Employee Attendance */}
      {tabValue === 3 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g., AU-EMP-2026-0001"
              helperText="Format: AU-EMP-YYYY-#### (e.g., AU-EMP-2026-0001)"
            />
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={fetchEmployeeAttendance}
              disabled={loading || !employeeId}
            >
              Search
            </Button>
          </Box>
          {Object.keys(summary).length > 0 && renderSummary()}
          {renderAttendanceTable()}
        </Box>
      )}

      {/* Tab 4: Live Activity */}
      {tabValue === 4 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={fetchTodayAttendance}
              disabled={loading}
            >
              Refresh Live Feed
            </Button>
          </Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Latest Attendance Events
          </Typography>
          {liveActivity.slice(0, 20).map((rec, idx) => (
            <Card key={idx} sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {rec.check_in_time}
                    </Typography>
                    <Typography variant="subtitle2">
                      ? {rec.person_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {rec.person_type === 'student' ? 'Student' : 'Employee'} • {rec.department_name}
                    </Typography>
                  </Box>
                  <Chip
                    label={rec.attendance_status}
                    color={getStatusColor(rec.attendance_status)}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Correction Dialog */}
      <Dialog open={correctionDialog} onClose={() => setCorrectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Correct Attendance</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedAttendance && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Current Status:</strong> {selectedAttendance.attendance_status}
                </Typography>
              </Alert>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="New Status"
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="excused">Excused</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Correction Reason"
                multiline
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Explain why this correction is needed"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorrectionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCorrectAttendance}
            variant="contained"
            disabled={loading || !newStatus || !correctionReason}
          >
            {loading ? <CircularProgress size={24} /> : 'Correct'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AttendanceModule;
