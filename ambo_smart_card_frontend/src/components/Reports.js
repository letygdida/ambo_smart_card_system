import { API_URL } from '../config';
import { getToken } from '../auth';

import React, { useEffect, useState } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

function CafeteriaAttendanceReports() {
  const [mealStatus, setMealStatus] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    mealType: 'all',
    date: new Date().toISOString().split('T')[0],
    department: '',
    studentId: '',
    status: 'all',
    page: 1,
    limit: 50
  });

  const [openScanDialog, setOpenScanDialog] = useState(false);
  const [scanStudentId, setScanStudentId] = useState('');
  const [scanning, setScanning] = useState(false);

  const token = getToken();
  const userRole = localStorage.getItem('role');

  // Check authorization
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Only admins and staff can access cafeteria dashboard
    if (userRole !== 'admin' && userRole !== 'staff') {
      setError('You do not have permission to access the Cafeteria Attendance Dashboard');
      setLoading(false);
      return;
    }

    fetchMealStatus();
    fetchTodaySummary();
    fetchRecords();

    // Refresh meal status every minute
    const interval = setInterval(() => {
      fetchMealStatus();
      fetchTodaySummary();
    }, 60000);

    return () => clearInterval(interval);
  }, [token, userRole, navigate]);

  // Refetch records when filters change
  useEffect(() => {
    if (loading === false) {
      fetchRecords();
    }
  }, [filters.mealType, filters.date, filters.department, filters.studentId, filters.status, filters.page]);

  const fetchMealStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cafeteria/meal-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response');
      }
      
      const data = JSON.parse(text);
      setMealStatus(data);
    } catch (err) {
      console.error('? Meal status fetch error:', err);
      setError('Failed to fetch meal status. Please ensure cafeteria backend routes are available.');
    }
  };

  const fetchTodaySummary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cafeteria/today-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response');
      }
      
      const data = JSON.parse(text);
      if (data.success) {
        setTodaySummary(data);
      }
    } catch (err) {
      console.error('? Today summary fetch error:', err);
      setError('Failed to fetch today summary. Please ensure cafeteria backend routes are available.');
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.mealType !== 'all') params.append('mealType', filters.mealType);
      params.append('date', filters.date);
      if (filters.department) params.append('department', filters.department);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await fetch(
        `${API_URL}/api/cafeteria/records?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response');
      }
      
      const data = JSON.parse(text);

      if (data.success) {
        setRecords(data.records || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch cafeteria records');
      }
    } catch (err) {
      console.error('? Records fetch error:', err);
      setError(`Error: ${err.message}. Please ensure cafeteria backend routes are running.`);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scanStudentId.trim()) {
      setMessage('Please enter or scan a student ID');
      return;
    }

    try {
      setScanning(true);
      setMessage('');

      const response = await fetch(`${API_URL}/api/cafeteria/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: scanStudentId,
          scannerId: 'CAFT-SCANNER-001',
          verificationMethod: 'manual'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`? ${data.message}`);
        setScanStudentId('');
        setOpenScanDialog(false);
        setTimeout(() => {
          fetchTodaySummary();
          fetchRecords();
        }, 500);
      } else {
        setMessage(`? ${data.error || data.message}`);
      }
    } catch (err) {
      setMessage(`? Error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters({
      ...filters,
      [filterKey]: value,
      page: 1
    });
  };

  const exportCSV = () => {
    if (records.length === 0) {
      alert('No cafeteria attendance records to export');
      return;
    }

    // Prepare data for CSV export
    const csvData = records.map(record => ({
      'Student ID': record.student_id,
      'Student Name': record.student_name,
      'Department': record.department_name,
      'Meal Type': record.meal_type.toUpperCase(),
      'Date': record.attendance_date,
      'Time': record.scan_time,
      'Status': record.attendance_status,
      'Rejection Reason': record.rejection_reason || '',
      'Scanner Location': record.scanner_location || '',
      'Verification Method': record.verification_method || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cafeteria_attendance_report_${filters.date}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Color codes for meal types
  const getMealColor = (mealType) => {
    const colors = {
      breakfast: '#FF8C42',
      lunch: '#4CAF50',
      dinner: '#2196F3'
    };
    return colors[mealType] || '#757575';
  };

  // Status color codes
  const getStatusColor = (status) => {
    if (status === 'attended') return 'success';
    if (status.includes('rejected')) return 'error';
    return 'default';
  };

  return (
    <div style={{ padding: '30px' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        ??? Cafeteria Attendance Reports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity={message.includes('?') ? 'success' : 'warning'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* Meal Status & Controls */}
      {mealStatus && (
        <Card sx={{ mb: 3, bgcolor: '#fafafa' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Meal Status - Current Time: {mealStatus.currentTime}</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenScanDialog(true)}
              >
                ?? Manual Scan
              </Button>
            </Box>

            <Grid container spacing={2}>
              {Object.entries(mealStatus.mealStatus || {}).map(([key, meal]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Box
                    sx={{
                      p: 2,
                      border: `2px solid ${getMealColor(key)}`,
                      borderRadius: 1,
                      bgcolor: meal.is_open ? `${getMealColor(key)}20` : '#f0f0f0'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {key}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                      {meal.start_time} – {meal.end_time}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={meal.is_open ? '? OPEN' : '?? CLOSED'}
                        color={meal.is_open ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Today's Summary Cards */}
      {todaySummary && todaySummary.summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#4CAF50', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Total Attendance</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {todaySummary.summary.totalAttendance || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {Object.entries(todaySummary.summary.byMeal || {}).map(([meal, data]) => (
            <Grid item xs={12} sm={6} md={3} key={meal}>
              <Card sx={{ bgcolor: getMealColor(meal), color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {meal}
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>
                    {data.attended || 0}
                  </Typography>
                  <Typography variant="caption">
                    Attended: {data.attended || 0} | Rejected: {data.rejected || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#F44336', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Rejected</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {todaySummary.summary.totalRejected || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Filters
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Meal</InputLabel>
                <Select
                  value={filters.mealType}
                  onChange={(e) => handleFilterChange('mealType', e.target.value)}
                  label="Meal"
                >
                  <MenuItem value="all">All Meals</MenuItem>
                  <MenuItem value="breakfast">Breakfast</MenuItem>
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="dinner">Dinner</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                size="small"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Department"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Student ID"
                value={filters.studentId}
                onChange={(e) => handleFilterChange('studentId', e.target.value)}
                placeholder="e.g., 2026-7300"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="attended">Attended</MenuItem>
                  <MenuItem value="rejected_duplicate">Rejected (Duplicate)</MenuItem>
                  <MenuItem value="rejected_outside_time">Rejected (Outside Time)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilters({
                    mealType: 'all',
                    date: new Date().toISOString().split('T')[0],
                    department: '',
                    studentId: '',
                    status: 'all',
                    page: 1,
                    limit: 50
                  });
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={exportCSV}
          disabled={records.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Records Table */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Cafeteria Attendance Records
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : records.length === 0 ? (
            <Alert severity="info">No cafeteria attendance records found for the selected filters</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Student ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Smart Card ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Meal</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow key={record.id || index} hover>
                      <TableCell>{record.id || index + 1}</TableCell>
                      <TableCell>{record.student_id}</TableCell>
                      <TableCell>{record.student_name}</TableCell>
                      <TableCell>{record.department_name}</TableCell>
                      <TableCell>{record.year || 'N/A'}</TableCell>
                      <TableCell>{record.smart_card_id || 'N/A'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={record.meal_type ? record.meal_type.toUpperCase() : 'N/A'}
                          sx={{
                            bgcolor: getMealColor(record.meal_type),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.attendance_date}</TableCell>
                      <TableCell>{record.scan_time}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.attendance_status === 'attended' ? '? Attended' : '? Rejected'}
                          color={getStatusColor(record.attendance_status)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {record.rejection_reason && (
                          <Typography variant="caption" sx={{ color: 'error.main' }}>
                            {record.rejection_reason}
                          </Typography>
                        )}
                        {record.scanner_location && (
                          <Typography variant="caption" display="block">
                            Scanner: {record.scanner_location}
                          </Typography>
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

      {/* Manual Scan Dialog */}
      <Dialog open={openScanDialog} onClose={() => setOpenScanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>?? Manual Cafeteria Scan</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Student ID"
            value={scanStudentId}
            onChange={(e) => setScanStudentId(e.target.value)}
            placeholder="Scan or enter student ID"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleScan();
              }
            }}
          />
          {message && (
            <Alert severity={message.includes('?') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScanDialog(false)}>Cancel</Button>
          <Button
            onClick={handleScan}
            variant="contained"
            disabled={scanning}
          >
            {scanning ? 'Scanning...' : 'Scan'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CafeteriaAttendanceReports;

