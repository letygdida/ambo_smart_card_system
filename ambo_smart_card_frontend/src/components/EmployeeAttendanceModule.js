import { API_URL } from '../config';

import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function EmployeeAttendanceModule() {
  const [tabValue, setTabValue] = useState(0);
  const [markEmployeeId, setMarkEmployeeId] = useState('');
  const [attendanceType, setAttendanceType] = useState('check-in'); // NEW: Attendance type selector
  const [markedEmployee, setMarkedEmployee] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // NEW: Attendance Control Status
  const [controlStatus, setControlStatus] = useState(null);
  const [controlLoading, setControlLoading] = useState(true);

  // NEW: Control Panel States
  const [controlMode, setControlMode] = useState('manual');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configForm, setConfigForm] = useState({
    auto_start_time: '08:00',
    auto_end_time: '15:10',
    active_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    description: ''
  });

  // Camera Scanner States
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);

  // Filters
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('');

  // Data
  const [attendanceData, setAttendanceData] = useState({});
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [summary, setSummary] = useState({});

  // Options
  const [uniqueCampuses, setUniqueCampuses] = useState([]);
  const [uniqueDepartments, setUniqueDepartments] = useState([]);

  const [scannerStatus, setScannerStatus] = useState('checking');
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const token = localStorage.getItem('token');

  // Load attendance control status on mount
  useEffect(() => {
    loadControlStatus();
    
    // Refresh control status every 30 seconds
    const interval = setInterval(() => {
      loadControlStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [attendanceType]);

  // Auto-load attendance data when switching to View Attendance tab
  useEffect(() => {
    if (tabValue === 2 || tabValue === 3) {
      fetchAttendanceData();
    }
  }, [tabValue]);

  // Load control status function
  const loadControlStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employee-attendance-control/status/${attendanceType}`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Backend returned non-JSON response. Server may not be running correctly.');
        setControlLoading(false);
        setError('⚠️ Attendance control system is not available. Please restart the backend server.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setControlStatus(data.control);
        setControlMode(data.control?.control_mode || 'manual');
        setControlLoading(false);
        setError(''); // Clear any previous errors
      } else {
        setControlLoading(false);
        setError('⚠️ Failed to load attendance control status');
      }
    } catch (err) {
      console.error('Error loading control status:', err);
      setControlLoading(false);
      setError(''); // Don't show error - control system is optional
      setControlStatus(null);
    }
  };

  // Manual control: Open attendance
  const handleManualOpen = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/login';
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/employee-attendance-control/manual/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attendance_type: attendanceType })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('❌ Backend error: Server not responding correctly. Please restart backend and run database migration.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to open attendance');
        setLoading(false);
        return;
      }

      setSuccess(`✅ ${attendanceType} attendance opened successfully`);
      loadControlStatus();
      setLoading(false);

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (err.message.includes('Invalid token') || err.message.includes('jwt expired')) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        window.location.href = '/login';
      } else {
        setError(`❌ Error: ${err.message}. Ensure backend is running.`);
      }
      setLoading(false);
    }
  };

  // Manual control: Close attendance
  const handleManualClose = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/login';
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/employee-attendance-control/manual/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attendance_type: attendanceType })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('❌ Backend error: Server not responding correctly. Please restart backend and run database migration.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to close attendance');
        setLoading(false);
        return;
      }

      setSuccess(`✅ ${attendanceType} attendance closed successfully`);
      loadControlStatus();
      setLoading(false);

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (err.message.includes('Invalid token') || err.message.includes('jwt expired')) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        window.location.href = '/login';
      } else {
        setError(`❌ Error: ${err.message}. Ensure backend is running.`);
      }
      setLoading(false);
    }
  };

  // Save configuration
  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/employee-attendance-control/configure`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attendance_type: attendanceType,
          control_mode: controlMode,
          auto_start_time: configForm.auto_start_time,
          auto_end_time: configForm.auto_end_time,
          active_days: configForm.active_days,
          description: configForm.description
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('❌ Backend error: Server returned invalid response. Please restart the backend server and ensure the database is set up.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update configuration');
        setLoading(false);
        return;
      }

      setSuccess('✅ Configuration updated successfully');
      setShowConfigDialog(false);
      loadControlStatus();
      setLoading(false);

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Configuration save error:', err);
      setError(`❌ Error: ${err.message}. Backend may not be running or database not set up.`);
      setLoading(false);
    }
  };

  // Load employee types list on mount
  useEffect(() => {
    fetchEmployeeTypesList();
  }, []);

  // Load attendance data when filters change
  useEffect(() => {
    if (tabValue === 2 || tabValue === 3) {
      fetchAttendanceData();
    }
  }, [tabValue, employeeTypeFilter, dateFilter, startDateFilter, endDateFilter, statusFilter, departmentFilter, campusFilter]);

  const fetchEmployeeTypesList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/attendance/employee-types-list`);
      const data = await res.json();
      setEmployeeTypes(data.employee_types || []);
    } catch (err) {
      console.error('Error fetching employee types:', err);
    }
  };

  // Handle camera scanner detection
  const handleCameraScan = (result) => {
    if (result && result[0]?.rawValue) {
      try {
        // Try to parse as JSON first (QR codes from employee smart cards)
        const data = JSON.parse(result[0].rawValue);
        if (data.employeeId) {
          console.log('QR Code detected with employee ID:', data.employeeId);
          setMarkEmployeeId(data.employeeId);
          setSuccess(`QR Code scanned: ${data.employeeId}`);
          // Auto-mark attendance after QR code detection
          setTimeout(() => {
            handleAutoMarkAttendance(data.employeeId);
          }, 500);
        } else if (data.studentId) {
          // Handle cases where employee cards might use studentId format
          console.log('Student ID format detected, treating as employee ID:', data.studentId);
          setMarkEmployeeId(data.studentId);
          setSuccess(`QR Code scanned: ${data.studentId}`);
        } else {
          // If JSON but no recognizable ID field, treat as plain text
          const scannedValue = result[0].rawValue;
          console.log('JSON detected but no employeeId, using raw value:', scannedValue);
          setMarkEmployeeId(scannedValue);
          setSuccess(`Code scanned: ${scannedValue}`);
        }
      } catch (e) {
        // If not JSON, treat as plain employee ID (barcodes)
        const scannedValue = result[0].rawValue;
        console.log('Barcode/Plain text detected:', scannedValue);
        setMarkEmployeeId(scannedValue);
        setSuccess(`Employee ID scanned: ${scannedValue}`);
        // Auto-mark attendance after barcode detection
        setTimeout(() => {
          handleAutoMarkAttendance(scannedValue);
        }, 500);
      }
      
      // Hide scanner after successful scan
      setShowCameraScanner(false);
      setCameraError('');
    }
  };

  const handleCameraError = (error) => {
    console.error('Camera scanner error:', error);
    setCameraError(`Camera error: ${error?.message || 'Unable to access camera'}`);
    setError(`❌ Camera Error: ${error?.message || 'Unable to access camera'}`);
  };

  const handleAutoMarkAttendance = async (employeeId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/login';
      return;
    }
    
    try {
      setScanning(true);
      setError('');
      setSuccess('Processing scan...');

      const res = await fetch(`${API_URL}/api/attendance/mark-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          employee_id: employeeId,
          attendance_type: attendanceType 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(`❌ ${data.message || 'Failed to mark attendance'}`);
        setMarkedEmployee(null);
        setScanning(false);
        return;
      }

      setSuccess(`✅ ${data.message}`);
      setMarkedEmployee(data.employee);
      setScanning(false);

      // Auto-refresh attendance data to show new record
      setTimeout(() => {
        fetchAttendanceData();
      }, 500);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (err) {
      if (err.message.includes('Invalid token') || err.message.includes('jwt expired')) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        window.location.href = '/login';
      } else {
        setError(`❌ Scan Error: ${err.message}`);
      }
      console.error('Auto mark employee attendance error:', err);
      setMarkedEmployee(null);
      setScanning(false);
    }
  };

  const markAttendance = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/login';
      return;
    }
    
    if (!markEmployeeId) {
      setError('Please enter an employee ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${API_URL}/api/attendance/mark-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          employee_id: markEmployeeId,
          attendance_type: attendanceType 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to mark attendance');
        setMarkedEmployee(null);
        setLoading(false);
        return;
      }

      setSuccess(data.message);
      setMarkedEmployee(data.employee);
      setMarkEmployeeId('');
      setLoading(false);

      // Auto-refresh attendance data to show new record (always refresh regardless of current tab)
      // Force immediate refresh by clearing cache and reloading
      setTimeout(() => {
        fetchAttendanceData();
      }, 500);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Mark employee attendance error:', err);
      setMarkedEmployee(null);
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      let url = '\/api/attendance/employee-types?';
      const params = [];

      if (employeeTypeFilter && employeeTypeFilter !== 'All') {
        params.push(`employee_type=${encodeURIComponent(employeeTypeFilter)}`);
      }

      if (dateFilter) {
        params.push(`date=${dateFilter}`);
      }

      if (startDateFilter) {
        params.push(`startDate=${startDateFilter}`);
      }

      if (endDateFilter) {
        params.push(`endDate=${endDateFilter}`);
      }

      if (statusFilter) {
        params.push(`attendance_status=${encodeURIComponent(statusFilter)}`);
      }

      if (departmentFilter) {
        params.push(`department_id=${departmentFilter}`);
      }

      if (campusFilter) {
        params.push(`campus=${encodeURIComponent(campusFilter)}`);
      }

      url += params.join('&');

      const res = await fetch(url);
      const data = await res.json();

      setAttendanceData(data.by_employee_type || {});
      extractFilterOptions(data.raw || []);

      setError('');
    } catch (err) {
      setError(`Error fetching attendance: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractFilterOptions = (records) => {
    const campuses = new Set();
    const departments = new Set();

    records.forEach(record => {
      if (record.campus) campuses.add(record.campus);
      if (record.department_name) departments.add(record.department_name);
    });

    setUniqueCampuses(Array.from(campuses).sort());
    setUniqueDepartments(Array.from(departments).sort());
  };

  // CSV Export Functions
  const convertToCSV = (data, staffType = 'All') => {
    if (!data || data.length === 0) return '';

    const headers = [
      'Employee Name',
      'Employee ID',
      'Staff Type',
      'Position',
      'Department',
      'Campus',
      'Date',
      'Check In Time',
      'Check Out Time',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        `"${record.employee_name || record.person_name || ''}"`,
        `"${record.employee_id || ''}"`,
        `"${record.employee_type || staffType}"`,
        `"${record.position || record.employee_position || ''}"`,
        `"${record.department || record.department_name || ''}"`,
        `"${record.campus || ''}"`,
        `"${record.attendance_date || record.scan_date || ''}"`,
        `"${record.check_in_time || record.scan_time || ''}"`,
        `"${record.check_out_time || ''}"`,
        `"${record.attendance_status || record.status || ''}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('Preparing CSV export...');

      // Fetch all records without pagination for export
      let url = '\/api/attendance/employee-types?';
      const params = [];

      if (employeeTypeFilter && employeeTypeFilter !== 'All') {
        params.push(`employee_type=${encodeURIComponent(employeeTypeFilter)}`);
      }

      if (dateFilter) {
        params.push(`date=${dateFilter}`);
      }

      if (startDateFilter) {
        params.push(`startDate=${startDateFilter}`);
      }

      if (endDateFilter) {
        params.push(`endDate=${endDateFilter}`);
      }

      if (statusFilter) {
        params.push(`attendance_status=${encodeURIComponent(statusFilter)}`);
      }

      if (departmentFilter) {
        params.push(`department_id=${departmentFilter}`);
      }

      if (campusFilter) {
        params.push(`campus=${encodeURIComponent(campusFilter)}`);
      }

      // Add large limit to get all records
      params.push('limit=50000');

      url += params.join('&');

      const res = await fetch(url);
      const data = await res.json();

      if (data.by_employee_type && Object.keys(data.by_employee_type).length > 0) {
        // Create separate CSV for each staff type or combined CSV
        let allRecords = [];
        let totalRecords = 0;

        // Flatten all records from different staff types
        Object.entries(data.by_employee_type).forEach(([staffType, records]) => {
          const recordsWithType = records.map(record => ({
            ...record,
            employee_type: staffType
          }));
          allRecords = [...allRecords, ...recordsWithType];
          totalRecords += records.length;
        });

        const csvContent = convertToCSV(allRecords);
        const today = new Date().toISOString().split('T')[0];
        
        // Create descriptive filename
        let filenameParts = ['employee_attendance'];
        
        if (employeeTypeFilter && employeeTypeFilter !== 'All') {
          filenameParts.push(employeeTypeFilter.toLowerCase().replace(/\s+/g, '_'));
        }
        
        if (dateFilter) {
          filenameParts.push(dateFilter);
        } else if (startDateFilter && endDateFilter) {
          filenameParts.push(`${startDateFilter}_to_${endDateFilter}`);
        } else if (startDateFilter) {
          filenameParts.push(`from_${startDateFilter}`);
        } else if (endDateFilter) {
          filenameParts.push(`until_${endDateFilter}`);
        } else {
          filenameParts.push(today);
        }
        
        filenameParts.push(Date.now());
        const filename = `${filenameParts.join('_')}.csv`;
        
        downloadCSV(csvContent, filename);
        setSuccess(`✅ CSV exported successfully: ${totalRecords} records exported`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('❌ No records found to export with current filters');
      }
    } catch (err) {
      setError(`❌ Export Error: ${err.message}`);
      console.error('CSV Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTodayAttendance = async () => {
    try {
      setClearLoading(true);
      setError('');
      setSuccess('');

      // Step 1: Export CSV first
      setSuccess('📥 Exporting attendance records...');
      await handleExportCSV();

      // Wait a moment for export to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Clear attendance
      setSuccess('🗑️ Clearing today\'s attendance records...');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        window.location.href = '/login';
        setClearLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/attendance/clear-today-employees`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(`❌ ${data.error || 'Failed to clear attendance'}`);
        setClearLoading(false);
        return;
      }

      setSuccess(`✅ ${data.message} - ${data.recordsDeleted} records exported and cleared`);
      console.log('Export & Clear completed:', data);
      
      setOpenClearDialog(false);
      setClearLoading(false);

      // Refresh data after clear
      setTimeout(() => {
        fetchAttendanceData();
      }, 500);
    } catch (err) {
      if (err.message.includes('Invalid token') || err.message.includes('jwt expired')) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        window.location.href = '/login';
      } else {
        setError(`❌ Error: ${err.message}`);
      }
      console.error('Export & Clear error:', err);
      setClearLoading(false);
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

  const renderAttendanceTable = (records) => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead sx={{ background: '#f5f5f5' }}>
          <TableRow>
            <TableCell><strong>Employee Name</strong></TableCell>
            <TableCell><strong>Employee ID</strong></TableCell>
            <TableCell><strong>Position</strong></TableCell>
            <TableCell><strong>Department</strong></TableCell>
            <TableCell><strong>Date</strong></TableCell>
            <TableCell><strong>Check In</strong></TableCell>
            <TableCell><strong>Check Out</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 2 }}>
                No attendance records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((rec, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{rec.employee_name || rec.person_name || '-'}</TableCell>
                <TableCell>{rec.employee_id}</TableCell>
                <TableCell>{rec.position || rec.employee_position || '-'}</TableCell>
                <TableCell>{rec.department || rec.department_name || '-'}</TableCell>
                <TableCell>{formatAttendanceDate(rec.attendance_date || rec.scan_date)}</TableCell>
                <TableCell>{formatAttendanceTime(rec.check_in_time || rec.scan_time)}</TableCell>
                <TableCell>{formatAttendanceTime(rec.check_out_time)}</TableCell>
                <TableCell>
                  <Chip
                    label={rec.attendance_status || rec.status}
                    color={getStatusColor(rec.attendance_status || rec.status)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderGroupedAttendance = () => {
    if (Object.keys(attendanceData).length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 3 }}>
          No attendance records found matching the selected filters
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 3 }}>
        {Object.entries(attendanceData).map(([staffType, records]) => (
          <Accordion key={staffType} defaultExpanded={Object.keys(attendanceData).length === 1}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {staffType}
                <Chip
                  label={`${records.length} records`}
                  size="small"
                  sx={{ ml: 2 }}
                  color={records.length > 0 ? 'primary' : 'default'}
                  variant="outlined"
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderAttendanceTable(records)}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Employee Attendance Management & Reporting
      </Typography>

      {/* Only show error if it's NOT about control status, OR if control status truly failed */}
      {error && !error.includes('attendance control status') && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {error && error.includes('attendance control status') && !controlStatus && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>✓ {success}</strong>
          </Typography>
          {markedEmployee && (
            <Box sx={{ mt: 1 }}>
              {markedEmployee.full_name && (
                <Typography variant="body2">
                  <strong>Name:</strong> {markedEmployee.full_name}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Employee ID:</strong> {markedEmployee.employee_id}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {markedEmployee.employee_type}
              </Typography>
              {markedEmployee.department && (
                <Typography variant="body2">
                  <strong>Department:</strong> {markedEmployee.department}
                </Typography>
              )}
            </Box>
          )}
        </Alert>
      )}

      {/* Attendance Control Status Display */}
      {controlStatus && (
        <Card sx={{ 
          mb: 3, 
          bgcolor: controlStatus.current_status === 'open' ? '#e8f5e9' : '#ffebee',
          border: `2px solid ${controlStatus.current_status === 'open' ? '#4caf50' : '#f44336'}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: controlStatus.current_status === 'open' ? '#2e7d32' : '#c62828'
                }}>
                  {controlStatus.current_status === 'open' ? '🟢 OPEN' : '🔴 CLOSED'}
                  <Chip 
                    label={`${attendanceType.toUpperCase()}`}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {controlStatus.status_message}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                  Mode: {controlStatus.control_mode === 'manual' ? '👤 Manual' : '⏰ Automatic'}
                  {controlStatus.control_mode === 'automatic' && controlStatus.auto_start_time && (
                    <span> | Window: {controlStatus.auto_start_time} - {controlStatus.auto_end_time}</span>
                  )}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Attendance Type</InputLabel>
                  <Select
                    value={attendanceType}
                    onChange={(e) => setAttendanceType(e.target.value)}
                    label="Attendance Type"
                  >
                    <MenuItem value="check-in">Check-In</MenuItem>
                    <MenuItem value="check-out">Check-Out</MenuItem>
                    <MenuItem value="break-start">Break Start</MenuItem>
                    <MenuItem value="break-end">Break End</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadControlStatus}
                  disabled={controlLoading}
                >
                  🔄 Refresh
                </Button>
              </Box>
            </Box>

            {controlStatus.current_status === 'closed' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>⚠️ Attendance is currently CLOSED.</strong> Employees cannot mark {attendanceType} at this time.
                Contact your administrator to open attendance.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ mb: 3 }}>
        <Tab label="Mark Employee Attendance" />
        <Tab label="Attendance Control" />
        <Tab label="View Attendance" />
        <Tab label="Detailed Reports" />
      </Tabs>

      {/* Tab 0: Mark Employee Attendance */}
      {tabValue === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📋 Mark Employee Attendance by ID
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Scan or enter the employee's ID (AU-EMP-YYYY-####). The system will automatically identify their staff type.
              </Typography>

              {/* Camera Scanner Toggle */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showCameraScanner}
                      onChange={(e) => {
                        setShowCameraScanner(e.target.checked);
                        setCameraError('');
                        setError('');
                      }}
                      color="primary"
                    />
                  }
                  label="📷 Enable PC Camera QR/Barcode Scanner"
                />
                {showCameraScanner && (
                  <Typography variant="caption" sx={{ display: 'block', color: 'textSecondary', mt: 0.5 }}>
                    Camera will automatically detect QR codes and barcodes from employee ID cards
                  </Typography>
                )}
              </Box>

              {/* Camera Scanner Component */}
              {showCameraScanner && (
                <Card sx={{ mb: 3, bgcolor: '#f0f8ff', border: '2px dashed #1976d2' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      📷 PC Camera Scanner
                    </Typography>
                    
                    {cameraError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {cameraError}
                      </Alert>
                    )}

                    {/* Camera Scanner */}
                    <Box sx={{ 
                      border: '2px solid #1976d2', 
                      borderRadius: 2, 
                      p: 2, 
                      bgcolor: 'white',
                      position: 'relative'
                    }}>
                      <Scanner
                        onScan={handleCameraScan}
                        onError={handleCameraError}
                        constraints={{
                          video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            facingMode: 'environment' // Use back camera if available
                          }
                        }}
                        styles={{
                          container: {
                            width: '100%',
                            maxWidth: '500px',
                            margin: '0 auto'
                          },
                          video: {
                            width: '100%',
                            height: 'auto',
                            borderRadius: '8px'
                          }
                        }}
                        scanDelay={300}
                        allowMultiple={false}
                      />
                      
                      {/* Scanner overlay instructions */}
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 10, 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        bgcolor: 'rgba(0,0,0,0.7)', 
                        color: 'white',
                        px: 2, 
                        py: 1, 
                        borderRadius: 1,
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Position employee QR code or barcode in camera view
                        </Typography>
                      </Box>
                    </Box>

                    {/* Instructions */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        📋 How to use Camera Scanner:
                      </Typography>
                      <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
                        <li>Hold employee QR code or barcode steady in camera view</li>
                        <li>Scanner will automatically detect and process the code</li>
                        <li>Supports both QR codes (from employee smart cards) and barcodes (employee IDs)</li>
                        <li>Attendance will be marked automatically upon successful scan</li>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Manual Input Section */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Employee ID"
                  value={markEmployeeId}
                  onChange={(e) => setMarkEmployeeId(e.target.value)}
                  placeholder="e.g., AU-EMP-2026-0001"
                  helperText="Format: AU-EMP-YYYY-#### (e.g., AU-EMP-2026-0001)"
                  sx={{ flex: 1 }}
                  onKeyPress={(e) => e.key === 'Enter' && markAttendance()}
                />
                <Button
                  variant="contained"
                  color="success"
                  onClick={markAttendance}
                  disabled={loading || scanning || !markEmployeeId}
                  sx={{ mt: 1 }}
                >
                  {(loading || scanning) ? <CircularProgress size={24} /> : 'Mark Attendance'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 1: Attendance Control */}
      {tabValue === 1 && (
        <Box>
          {/* Control Panel Card */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                🎛️ Attendance Time Control
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                Control when employees can mark attendance. Choose Manual mode for direct control or Automatic mode for scheduled operation.
              </Typography>

              {controlStatus && (
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 2, borderRadius: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 0.5 }}>
                        Current Status
                      </Typography>
                      <Chip
                        label={controlStatus.current_status === 'open' ? '🟢 OPEN' : '🔴 CLOSED'}
                        sx={{
                          bgcolor: controlStatus.current_status === 'open' ? '#4caf50' : '#f44336',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 0.5 }}>
                        Attendance Type
                      </Typography>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={attendanceType}
                          onChange={(e) => setAttendanceType(e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                        >
                          <MenuItem value="check-in">Check-In</MenuItem>
                          <MenuItem value="check-out">Check-Out</MenuItem>
                          <MenuItem value="break-start">Break Start</MenuItem>
                          <MenuItem value="break-end">Break End</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 0.5 }}>
                        Control Mode
                      </Typography>
                      <Chip
                        label={controlStatus.control_mode === 'manual' ? '👤 Manual' : '⏰ Automatic'}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.25)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Manual Controls */}
            {controlStatus && controlStatus.control_mode === 'manual' && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      👤 Manual Control
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      Directly control when employees can mark attendance
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        size="large"
                        onClick={handleManualOpen}
                        disabled={loading || controlStatus.current_status === 'open'}
                        startIcon={<span>🔓</span>}
                      >
                        {loading ? <CircularProgress size={24} /> : 'OPEN ATTENDANCE'}
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        size="large"
                        onClick={handleManualClose}
                        disabled={loading || controlStatus.current_status === 'closed'}
                        startIcon={<span>🔒</span>}
                      >
                        {loading ? <CircularProgress size={24} /> : 'CLOSE ATTENDANCE'}
                      </Button>
                    </Box>

                    {controlStatus.status_message && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {controlStatus.status_message}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Automatic Schedule Display */}
            {controlStatus && controlStatus.control_mode === 'automatic' && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      ⏰ Automatic Schedule
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      System automatically controls attendance based on time window
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Time Window
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {controlStatus.auto_start_time} - {controlStatus.auto_end_time}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Active Days
                      </Typography>
                      <Typography variant="body1">
                        {controlStatus.active_days}
                      </Typography>
                    </Box>

                    {controlStatus.status_message && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {controlStatus.status_message}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Configuration Card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    ⚙️ Configuration
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Change control mode and schedule settings
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Control Mode</InputLabel>
                    <Select
                      value={controlMode}
                      onChange={(e) => setControlMode(e.target.value)}
                      label="Control Mode"
                    >
                      <MenuItem value="manual">👤 Manual Mode</MenuItem>
                      <MenuItem value="automatic">⏰ Automatic Mode</MenuItem>
                    </Select>
                  </FormControl>

                  {controlMode === 'automatic' && (
                    <>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <TextField
                            type="time"
                            label="Start Time"
                            value={configForm.auto_start_time}
                            onChange={(e) => setConfigForm({ ...configForm, auto_start_time: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            type="time"
                            label="End Time"
                            value={configForm.auto_end_time}
                            onChange={(e) => setConfigForm({ ...configForm, auto_end_time: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Active Days"
                        value={configForm.active_days}
                        onChange={(e) => setConfigForm({ ...configForm, active_days: e.target.value })}
                        fullWidth
                        helperText="Comma-separated (e.g., Monday,Tuesday,Wednesday)"
                        sx={{ mb: 2 }}
                      />
                    </>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleSaveConfig}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Configuration'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Today's Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    📊 Today's Summary
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Employee attendance recorded today
                  </Typography>

                  {controlStatus && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Check-Ins:</Typography>
                        <Typography variant="h6" color="primary">-</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Check-Outs:</Typography>
                        <Typography variant="h6" color="secondary">-</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={loadControlStatus}
                        sx={{ mt: 2 }}
                      >
                        🔄 Refresh Status
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 2: View Attendance */}
      {tabValue === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🔍 Filter Attendance Records
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Staff Type</InputLabel>
                    <Select
                      value={employeeTypeFilter}
                      onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                      label="Staff Type"
                    >
                      <MenuItem value="All">All Staff</MenuItem>
                      {employeeTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    type="date"
                    label="Date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="present">Present</MenuItem>
                      <MenuItem value="late">Late</MenuItem>
                      <MenuItem value="absent">Absent</MenuItem>
                      <MenuItem value="excused">Excused</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Campus</InputLabel>
                    <Select
                      value={campusFilter}
                      onChange={(e) => setCampusFilter(e.target.value)}
                      label="Campus"
                    >
                      <MenuItem value="">All Campuses</MenuItem>
                      {uniqueCampuses.map(campus => (
                        <MenuItem key={campus} value={campus}>{campus}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={fetchAttendanceData}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Apply Filters'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEmployeeTypeFilter('All');
                        setDateFilter('');
                        setStartDateFilter('');
                        setEndDateFilter('');
                        setStatusFilter('');
                        setCampusFilter('');
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportCSV}
                      color="success"
                      disabled={loading || Object.keys(attendanceData).length === 0}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => setOpenClearDialog(true)}
                    >
                      📥 Export & Clear Today
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderGroupedAttendance()
          )}
        </Box>
      )}

      {/* Tab 3: Detailed Reports */}
      {tabValue === 3 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📊 Attendance Summary by Staff Type
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Use the filters from the "View Attendance" tab, then select this tab to see detailed statistics.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCSV}
                  color="primary"
                  disabled={loading || Object.keys(attendanceData).length === 0}
                  size="small"
                >
                  Export Report CSV
                </Button>
              </Box>
              
              {Object.keys(attendanceData).length > 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {Object.entries(attendanceData).map(([staffType, records]) => {
                    const present = records.filter(r => r.attendance_status === 'present').length;
                    const late = records.filter(r => r.attendance_status === 'late').length;
                    const absent = records.filter(r => r.attendance_status === 'absent').length;
                    const rate = records.length > 0 ? Math.round(((present + late) / records.length) * 100) : 0;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={staffType}>
                        <Card>
                          <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                              {staffType}
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 1 }}>
                              {records.length} Records
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  ✓ Present: <strong>{present}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  ⏱ Late: <strong>{late}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  ✗ Absent: <strong>{absent}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  Rate: <strong>{rate}%</strong>
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Clear Today's Attendance Dialog */}
      <Dialog open={openClearDialog} onClose={() => setOpenClearDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
          📥 Export & Clear Today's Employee Attendance
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            ℹ️ This will:<br/>
            1️⃣ <strong>Export</strong> all employee attendance for today to CSV<br/>
            2️⃣ <strong>Delete</strong> all records after export completes
          </Alert>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ <strong>This cannot be undone!</strong> Ensure records are exported before proceeding.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Date:</strong> {new Date().toISOString().split('T')[0]}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'textSecondary' }}>
            A CSV file will be downloaded automatically, then all employee check-in records will be cleared.
          </Typography>
          <Typography variant="body2">
            Are you sure you want to export and clear all employee attendance records for today?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearDialog(false)} disabled={clearLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleClearTodayAttendance}
            variant="contained"
            color="warning"
            disabled={clearLoading}
          >
            {clearLoading ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                Exporting & Clearing...
              </>
            ) : (
              '📥 Export & Clear'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmployeeAttendanceModule;
