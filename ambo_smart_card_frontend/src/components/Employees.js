import { API_URL } from '../config';
import { getToken, clearSession } from '../auth';

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Typography,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CardIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import EmployeeSmartIDUnified from './EmployeeSmartIDUnified';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployeeForCard, setSelectedEmployeeForCard] = useState(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const importFileRef = React.useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    employeeType: '',
    staffCategory: '',
    departmentId: '',
    position: '',
    employmentStatus: 'active',
    employmentStartDate: '',
    faculty: '',
    campus: '',
    officeLocation: '',
    photo: null,
    photoPreview: null
  });
  const [stats, setStats] = useState({});
  const fileInputRef = React.useRef(null);
  const token = getToken();

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
    fetchStats();
    fetchDepartments();
  }, []);

  const fetchEmployees = () => {
    const token = getToken();
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }
    
    setLoading(true);
    fetch(`${API_URL}/api/employees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEmployees(data.employees || []);
        setError('');
      })
      .catch(err => {
        if (err.message.includes('Invalid token') || err.message.includes('jwt expired')) {
          setError('Session expired. Please log in again.');
          clearSession();
          localStorage.removeItem('role');
          localStorage.removeItem('username');
          window.location.href = '/login';
        } else {
          setError('Failed to fetch employees');
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  };

  const fetchDepartments = () => {
    fetch(`${API_URL}/api/departments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepartments(data);
        } else if (data.departments) {
          setDepartments(data.departments);
        }
      })
      .catch(err => {
        console.error('Failed to fetch departments:', err);
        // Fallback departments if API fails
        setDepartments([
          { id: 1, department_name: 'Computer Science' },
          { id: 2, department_name: 'Information Systems' },
          { id: 3, department_name: 'Electrical Engineering' },
          { id: 4, department_name: 'Economics' }
        ]);
      });
  };

  const fetchStats = () => {
    const token = getToken();
    if (!token) return;
    
    fetch(`${API_URL}/api/employees/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => {
        if (err.message.includes('Invalid token') || err.message.includes('jwt expired')) {
          setError('Session expired. Please log in again.');
          clearSession();
          localStorage.removeItem('role');
          localStorage.removeItem('username');
          window.location.href = '/login';
        } else {
          console.error(err);
        }
      });
  };

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.first_name || '',
        middleName: employee.middle_name || '',
        lastName: employee.last_name || '',
        gender: employee.gender || '',
        dateOfBirth: employee.date_of_birth || '',
        phone: employee.phone || '',
        email: employee.email || '',
        employeeType: employee.employee_type || '',
        staffCategory: employee.staff_category || '',
        departmentId: employee.department_id || '',
        position: employee.position || '',
        employmentStatus: employee.employment_status || 'active',
        employmentStartDate: employee.employment_start_date || '',
        faculty: employee.faculty || '',
        campus: employee.campus || '',
        officeLocation: employee.office_location || '',
        photo: null,
        photoPreview: employee.photo || null
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        employeeType: '',
        staffCategory: '',
        departmentId: '',
        position: '',
        employmentStatus: 'active',
        employmentStartDate: '',
        faculty: '',
        campus: '',
        officeLocation: '',
        photo: '',
        photoPreview: null
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photo: file,
          photoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo: null,
      photoPreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Convert photo to base64 if it exists
      let photoBase64 = null;
      if (formData.photo && formData.photo instanceof File) {
        photoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(formData.photo);
        });
      }

      // Prepare JSON data
      const submitData = {
        firstName: formData.firstName || '',
        middleName: formData.middleName || '',
        lastName: formData.lastName || '',
        gender: formData.gender || '',
        dateOfBirth: formData.dateOfBirth || '',
        phone: formData.phone || '',
        email: formData.email || '',
        employeeType: formData.employeeType || '',
        staffCategory: formData.staffCategory || '',
        departmentId: formData.departmentId || '',
        position: formData.position || '',
        employmentStatus: formData.employmentStatus || 'active',
        employmentStartDate: formData.employmentStartDate || '',
        faculty: formData.faculty || '',
        campus: formData.campus || '',
        officeLocation: formData.officeLocation || '',
        photo: photoBase64 // Send as base64 string
      };

      if (editingEmployee) {
        // Update employee
        const res = await fetch(`${API_URL}/api/employees/${editingEmployee.employee_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        });

        const responseData = await res.json();
        
        if (!res.ok) {
          throw new Error(responseData?.error || responseData?.details || 'Failed to update employee');
        }

        alert('Employee updated successfully');
      } else {
        // Create new employee
        const res = await fetch(`${API_URL}/api/employees`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        });

        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData?.error || responseData?.details || 'Failed to create employee');
        }

        alert(`Employee created successfully!\nEmployee ID: ${responseData.employeeId}`);
      }

      handleCloseDialog();
      fetchEmployees();
      fetchStats();
    } catch (err) {
      const errorMsg = err?.message || err?.toString() || 'Unknown error occurred';
      console.error('Submit error:', err);
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCard = async (employeeId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/employees/${employeeId}/generate-card`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to generate card');
      const data = await res.json();
      alert(`Smart Card generated!\nCard Number: ${data.cardNumber}`);
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCard = (employee) => {
    setSelectedEmployeeForCard(employee);
    setCardDialogOpen(true);
  };

  const handleDeactivate = async (employeeId) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        const res = await fetch(`${API_URL}/api/employees/${employeeId}/deactivate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to deactivate');

        // Immediately update the employee status in UI
        setEmployees(prevEmployees =>
          prevEmployees.map(emp =>
            emp.employee_id === employeeId
              ? { ...emp, employment_status: 'inactive' }
              : emp
          )
        );

        // Refetch stats from backend to ensure accuracy
        fetchStats();

        alert('? Employee deactivated successfully');
      } catch (err) {
        setError(err.message);
        alert('? Error: ' + err.message);
      }
    }
  };

  const handleReactivate = async (employeeId) => {
    try {
      const res = await fetch(`${API_URL}/api/employees/${employeeId}/reactivate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reactivate');

      // Immediately update the employee status in UI
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp.employee_id === employeeId
            ? { ...emp, employment_status: 'active' }
            : emp
        )
      );

      // Refetch stats from backend to ensure accuracy
      fetchStats();

      alert('? Employee reactivated successfully');
    } catch (err) {
      setError(err.message);
      alert('? Error: ' + err.message);
    }
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm(`?? Are you sure you want to DELETE this employee? This action cannot be undone.`)) {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/employees/${employeeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to delete employee');

        // Remove from list
        setEmployees(prevEmployees =>
          prevEmployees.filter(emp => emp.employee_id !== employeeId)
        );

        // Refetch stats
        fetchStats();

        alert('? Employee deleted successfully');
      } catch (err) {
        setError(err.message);
        alert('? Error: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImportEmployees = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    try {
      setImportLoading(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch(`${API_URL}/api/employees/import/bulk`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to import employees');

      setImportResults(data);
      setImportFile(null);
      if (importFileRef.current) importFileRef.current.value = '';

      // Refetch employees and stats
      setTimeout(() => {
        fetchEmployees();
        fetchStats();
      }, 500);

      alert(`? Import complete: ${data.success} succeeded, ${data.failed} failed`);
    } catch (err) {
      setError(err.message);
      alert('? Error: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'success',
      'inactive': 'error',
      'on_leave': 'warning',
      'suspended': 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Employee Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Total Employees</Typography>
              <Typography variant="h5">{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Active</Typography>
              <Typography variant="h5">{stats.active || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Inactive</Typography>
              <Typography variant="h5">{stats.inactive || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Cards Issued</Typography>
              <Typography variant="h5">{stats.cards_issued || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          ADD EMPLOYEE
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setImportDialogOpen(true)}
          disabled={loading}
        >
          IMPORT FROM EXCEL
        </Button>
      </Box>

      {/* Employees Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ background: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Card Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell><strong>{emp.employee_id}</strong></TableCell>
                  <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{emp.department_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={emp.employment_status}
                      color={getStatusColor(emp.employment_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={emp.card_status || 'Pending'}
                      color={emp.card_status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View ID Card">
                      <IconButton
                        size="small"
                        onClick={() => handleViewCard(emp)}
                        color="primary"
                      >
                        <CardIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(emp)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Generate Card">
                      <IconButton
                        size="small"
                        onClick={() => handleGenerateCard(emp.employee_id)}
                        disabled={emp.card_status === 'active'}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    {emp.employment_status === 'active' ? (
                      <Tooltip title="Deactivate">
                        <IconButton
                          size="small"
                          onClick={() => handleDeactivate(emp.employee_id)}
                          color="error"
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Reactivate">
                        <IconButton
                          size="small"
                          onClick={() => handleReactivate(emp.employee_id)}
                          color="success"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Employee">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(emp.employee_id)}
                        color="error"
                        sx={{ ml: 0.5 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Photo Upload Section */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: '140px',
              height: '140px',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: formData.photoPreview ? 'transparent' : '#f9f9f9',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              {formData.photoPreview ? (
                <Box
                  component="img"
                  src={formData.photoPreview}
                  alt="Preview"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography sx={{ color: '#999', textAlign: 'center', p: 2 }}>
                  Click to add photo
                </Typography>
              )}
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photo
              </Button>
              {formData.photoPreview && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleRemovePhoto}
                >
                  Remove
                </Button>
              )}
            </Box>
          </Box>

          {/* Form Fields */}
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Middle Name"
            name="middleName"
            value={formData.middleName}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              label="Gender"
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Employee Type</InputLabel>
            <Select
              name="employeeType"
              value={formData.employeeType}
              onChange={handleInputChange}
              label="Employee Type"
            >
              <MenuItem value="Academic Staff">Academic Staff</MenuItem>
              <MenuItem value="Administrative Staff">Administrative Staff</MenuItem>
              <MenuItem value="Technical Staff">Technical Staff</MenuItem>
              <MenuItem value="Support Staff">Support Staff</MenuItem>
              <MenuItem value="Security Staff">Security Staff</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select
              name="departmentId"
              value={formData.departmentId || ''}
              onChange={handleInputChange}
              label="Department"
            >
              <MenuItem value="">-- Select Department --</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.department_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Campus"
            name="campus"
            value={formData.campus}
            onChange={handleInputChange}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Employment Status</InputLabel>
            <Select
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleInputChange}
              label="Employment Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="resigned">Resigned</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingEmployee ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Employees Dialog */}
      <Dialog open={importDialogOpen} onClose={() => {
        setImportDialogOpen(false);
        setImportFile(null);
        setImportResults(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Import Employees from Excel</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {importResults ? (
            <Box>
              <Alert severity={importResults.failed === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                ? {importResults.success} imported successfully {importResults.failed > 0 ? `| ? ${importResults.failed} failed` : ''}
              </Alert>
              
              {importResults.employees.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Successfully Imported ({importResults.employees.length}):</Typography>
                  <Box sx={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px', p: 1 }}>
                    {importResults.employees.map((emp, idx) => (
                      <Typography key={idx} sx={{ fontSize: '0.9rem', p: 0.5 }}>
                        {emp.employeeId}: {emp.firstName} {emp.lastName} ({emp.email})
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {importResults.errors.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, color: '#d32f2f' }}>Errors ({importResults.errors.length}):</Typography>
                  <Box sx={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ff6b6b', borderRadius: '4px', p: 1, bgcolor: '#ffebee' }}>
                    {importResults.errors.map((err, idx) => (
                      <Typography key={idx} sx={{ fontSize: '0.85rem', p: 0.5, color: '#d32f2f' }}>
                        Row {err.row}: {err.error}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Typography sx={{ mb: 2, color: '#666' }}>
                Upload an Excel file with the following columns:
              </Typography>
              <Box sx={{ 
                border: '2px dashed #1976d2', 
                borderRadius: '8px', 
                p: 3, 
                textAlign: 'center',
                bgcolor: '#f5f5f5',
                cursor: 'pointer',
                mb: 2
              }}
              onClick={() => importFileRef.current?.click()}
              >
                <UploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                <Typography sx={{ mb: 1, fontWeight: 'bold' }}>
                  Click to select or drag and drop
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
                  {importFile ? importFile.name : 'No file selected'}
                </Typography>
              </Box>

              <input
                ref={importFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />

              <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: '4px' }}>
                <strong>Required Columns:</strong><br/>
                • First Name<br/>
                • Last Name<br/>
                • Email<br/>
                • Position<br/>
                <strong>Optional Columns:</strong><br/>
                • Department • Phone • Gender • Employee Type
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImportDialogOpen(false);
            setImportFile(null);
            setImportResults(null);
          }}>
            {importResults ? 'Close' : 'Cancel'}
          </Button>
          {!importResults && (
            <Button
              onClick={handleImportEmployees}
              variant="contained"
              disabled={!importFile || importLoading}
              startIcon={importLoading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {importLoading ? 'Importing...' : 'IMPORT'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Employee ID Card Dialog */}
      <EmployeeSmartIDUnified
        employee={selectedEmployeeForCard}
        open={cardDialogOpen}
        onClose={() => {
          setCardDialogOpen(false);
          setSelectedEmployeeForCard(null);
        }}
      />
    </Box>
  );
}

export default Employees;
