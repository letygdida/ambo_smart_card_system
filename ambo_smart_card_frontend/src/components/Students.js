import { API_URL } from '../config';

import { useEffect, useState, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    TextField,
    Box,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function Students(){
    // State management
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [editId, setEditId] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all"); // all, active, blocked
    const [showForm, setShowForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Get user role from localStorage
    const userRole = localStorage.getItem("role");

    const [form, setForm] = useState({
        student_id: "",
        name: "",
        department: "",
        year: "",
        personal_email: "",
        phone_number: "",
        emergency_contact: "",
        photo: null
    });

    const token = localStorage.getItem("token");
    const [departments, setDepartments] = useState([]);

    const loadStudents = useCallback(() => {
        setFetchLoading(true);
        fetch(
            `${API_URL}/api/students`,
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        )
        .then(res => res.json())
        .then(data => {
            console.log('?? Students loaded:', data);
            
            if(Array.isArray(data)){
                setStudents(data);
                console.log(`? Loaded ${data.length} students`);
            }
            else{
                setStudents([]);
            }
            setFetchLoading(false);
        })
        .catch(err => {
            console.error('? Error loading students:', err);
            setStudents([]);
            setFetchLoading(false);
        });
    }, [token]);

    useEffect(() => {
        loadStudents();
        
        // Load departments
        fetch(`${API_URL}/api/departments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setDepartments(data);
            } else if (data.departments) {
                setDepartments(data.departments);
            }
        })
        .catch(err => {
            console.error('Failed to load departments:', err);
        });
    }, [loadStudents, token]);

    const handleChange = (e) => {
        if(e.target.name === "photo"){
            const file = e.target.files[0];
            setForm({
                ...form,
                photo: file
            });
            
            // Show preview
            if(file){
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPhotoPreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
        else{
            setForm({
                ...form,
                [e.target.name]: e.target.value
            });
        }
    };

    const clearForm = () => {
        setForm({
            student_id: "",
            name: "",
            department: "",
            year: "",
            personal_email: "",
            phone_number: "",
            emergency_contact: "",
            photo: null
        });
        setPhotoPreview(null);
        setEditId(null);
        setShowForm(false);
    };

    const validateForm = () => {
        const studentIdPattern = /^\d{4}\/\d{4}$/;

        if(!form.student_id.trim()){
            alert("Student ID is required");
            return false;
        }

        if(!studentIdPattern.test(form.student_id)){
            alert("Student ID must be in format: 2026/4795");
            return false;
        }

        if(!form.name.trim()){
            alert("Student name is required");
            return false;
        }

        if(!form.department.trim()){
            alert("Department is required");
            return false;
        }

        if(!String(form.year).trim() || form.year === "0"){
            alert("Year is required");
            return false;
        }

        return true;
    };

    const saveStudent = () => {
        if (!validateForm()) return;

        setIsLoading(true);

        const url = editId
            ? `${API_URL}/api/students/${editId}`
            : `${API_URL}/api/students/add`;

        console.log(`Submitting ${editId ? 'PUT' : 'POST'} for student:`, {
            student_id: form.student_id,
            name: form.name,
            department: form.department,
            year: form.year
        });

        // Add new student: send JSON (no photo on creation)
        // Edit student: send FormData so photo can be included
        let fetchOptions;
        if (!editId) {
            fetchOptions = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: form.student_id,
                    name: form.name,
                    department: form.department,
                    year: String(form.year),
                    personal_email: form.personal_email || '',
                    phone_number: form.phone_number || '',
                    emergency_contact: form.emergency_contact || ''
                })
            };
        } else {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("department", form.department);
            formData.append("year", String(form.year));
            formData.append("personal_email", form.personal_email || '');
            formData.append("phone_number", form.phone_number || '');
            formData.append("emergency_contact", form.emergency_contact || '');
            if (form.photo) { formData.append("photo", form.photo); }
            fetchOptions = {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            };
        }

        fetch(url, fetchOptions)
        .then(res => {
            console.log('Response status:', res.status);
            if (!res.ok) {
                return res.json().then(data => {
                    throw new Error(data.error || data.message || `HTTP ${res.status}`);
                }).catch(err => {
                    if (err instanceof Error) throw err;
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                });
            }
            return res.json();
        })
        .then(data => {
            console.log("? Response data:", data);
            
            if(data.error){
                alert("Error: " + data.error);
                setIsLoading(false);
                return;
            }

            setSuccessMessage(data.message || (editId ? "Student updated successfully!" : "Student added successfully!"));
            setTimeout(() => setSuccessMessage(""), 4000);
            
            // Reload students after a delay to ensure database write completes
            console.log('? Waiting 800ms before refreshing student list...');
            setTimeout(() => {
                console.log('?? Reloading students...');
                loadStudents();
                clearForm();
            }, 800);
            
            setIsLoading(false);
        })
        .catch(err => {
            console.error("? Error:", err);
            alert("Error saving student: " + err.message);
            setIsLoading(false);
        });
    };

    const editStudent = (student) => {
        setEditId(student.id);
        setForm({
            student_id: student.student_id,
            name: student.username || student.name || student.full_name,
            department: student.department,
            year: student.year,
            personal_email: student.personal_email || "",
            phone_number: student.phone_number || "",
            emergency_contact: student.emergency_contact_phone || "",
            photo: null
        });

        // Set photo preview if exists
        if(student.photo){
            setPhotoPreview(`${API_URL}/uploads/${student.photo}`);
        } else {
            setPhotoPreview(null);
        }
        
        setShowForm(true);
        
        console.log(`?? Editing student:`, {
            id: student.id,
            student_id: student.student_id,
            name: student.username || student.full_name,
            department: student.department,
            year: student.year
        });
    };

    const openDeleteDialog = (id) => {
        setDeleteConfirmId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteConfirmId) return;

        const id = deleteConfirmId;
        setDeleteLoading(true);
        setDeleteDialogOpen(false);
        setDeleteConfirmId(null);
        setErrorMessage("");
        
        console.log(`??? Starting delete process for student ID: ${id}`);
        console.log(`?? Sending DELETE request to: ${API_URL}/api/students/${id}`);
        console.log(`?? Authorization token: ${token ? '? Present' : '? Missing'}`);

        fetch(
            `${API_URL}/api/students/${id}`,
            {
                method: "DELETE",
                headers:{
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        )
        .then(res => {
            console.log('?? Delete response received');
            console.log('   Status:', res.status, res.statusText);
            console.log('   Content-Type:', res.headers.get('content-type'));
            
            // Check if response has content
            if (res.status === 204) {
                console.log('? No content response (204)');
                return { success: true, message: "Student deleted successfully" };
            }
            
            if (!res.ok) {
                console.error('? Non-OK response received');
                if(res.status === 403){
                    throw new Error("Access denied. Only administrators can delete students.");
                }
                if(res.status === 404){
                    throw new Error("Student not found.");
                }
                if(res.status === 500){
                    throw new Error("Server error. Please try again later.");
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            // Try to parse JSON response
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return res.json().then(data => {
                    console.log('?? JSON response parsed:', data);
                    return data;
                });
            } else {
                console.log('?? Response is not JSON, returning success message');
                return { success: true, message: "Student deleted successfully" };
            }
        })
        .then(data => {
            console.log('? Delete operation completed');
            console.log('   Response data:', data);
            
            setDeleteLoading(false);
            
            const message = data.message || data.success || "Student deleted successfully";
            console.log('?? Success message:', message);
            
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(""), 4000);
            
            // Reload students after a short delay to ensure database update completes
            console.log('? Waiting 300ms before reloading student list...');
            setTimeout(() => {
                console.log('?? Reloading student list...');
                loadStudents();
            }, 300);
        })
        .catch(err => {
            console.error('? Delete error caught:', err);
            console.error('   Error message:', err.message);
            console.error('   Error stack:', err.stack);
            
            setDeleteLoading(false);
            
            const errorMsg = err.message || "Unknown error occurred while deleting student";
            console.log('?? Setting error message:', errorMsg);
            
            setErrorMessage(errorMsg);
            setTimeout(() => setErrorMessage(""), 5000);
            
            // Also show alert for visibility
            alert('Error deleting student: ' + errorMsg);
        });
    };

    const toggleBlockStatus = (student) => {
        const newStatus = student.status === 'blocked' ? 'active' : 'blocked';
        const actionText = newStatus === 'blocked' ? 'block' : 'unblock';
        
        console.log(`?? Toggling status for student ${student.id} (${student.student_id}): ${student.status} ? ${newStatus}`);
        
        fetch(`${API_URL}/api/students/${student.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(res => {
            console.log('Status update response status:', res.status);
            if (!res.ok) {
                return res.json().then(data => {
                    throw new Error(data.error || data.message || `HTTP ${res.status}`);
                }).catch(err => {
                    if (err instanceof Error) throw err;
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                });
            }
            return res.json();
        })
        .then(data => {
            console.log('? Status update response:', data);
            setSuccessMessage(data.message || `Student ${actionText === 'block' ? 'blocked' : 'unblocked'} successfully`);
            setTimeout(() => setSuccessMessage(""), 4000);
            
            // Reload students after a short delay to ensure database update completes
            setTimeout(() => {
                loadStudents();
            }, 300);
        })
        .catch(err => {
            console.error('? Status update error:', err);
            alert('Error updating status: ' + err.message);
        });
    };

    const filteredStudents = students.filter((student) => {
        const text = search.toLowerCase();
        const matchesSearch = 
            String(student.student_id || "").toLowerCase().includes(text) ||
            String(student.username || student.name || "").toLowerCase().includes(text) ||
            String(student.personal_email || "").toLowerCase().includes(text);
        
        const matchesStatus = 
            filterStatus === "all" || 
            filterStatus === student.status;

        return matchesSearch && matchesStatus;
    });

    // Show loading state
    if (fetchLoading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '80vh' 
            }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div style={{ padding: "20px", backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ marginBottom: "30px" }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: "10px" }}>
                    ?? Student Management
                </Typography>
                <Typography variant="body2" sx={{ color: "#666" }}>
                    Manage student records, update information, and control access
                </Typography>
            </Box>

            {/* Success Message */}
            {successMessage && (
                <Alert severity="success" sx={{ marginBottom: "20px" }} onClose={() => setSuccessMessage("")}>
                    {successMessage}
                </Alert>
            )}

            {/* Error Message */}
            {errorMessage && (
                <Alert severity="error" sx={{ marginBottom: "20px" }} onClose={() => setErrorMessage("")}>
                    {errorMessage}
                </Alert>
            )}

            {/* Search and Filter Section */}
            <Box sx={{ 
                display: "flex", 
                gap: "15px", 
                marginBottom: "25px", 
                flexWrap: "wrap",
                alignItems: "center"
            }}>
                <TextField
                    placeholder="Search by ID, name, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: "#999" }} />,
                    }}
                    sx={{ 
                        flex: 1, 
                        minWidth: "300px",
                        backgroundColor: "white",
                        borderRadius: "8px"
                    }}
                />

                {/* Status Filter */}
                <Box sx={{ display: "flex", gap: "8px" }}>
                    {["all", "active", "blocked"].map(status => (
                        <Chip
                            key={status}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            onClick={() => setFilterStatus(status)}
                            color={filterStatus === status ? "primary" : "default"}
                            variant={filterStatus === status ? "filled" : "outlined"}
                        />
                    ))}
                </Box>

                {/* Add New Student Button */}
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        clearForm();
                        setShowForm(true);
                    }}
                    sx={{ whiteSpace: "nowrap" }}
                >
                    Add Student
                </Button>
            </Box>

            {/* Add/Edit Form Dialog */}
            <Dialog 
                open={showForm} 
                onClose={clearForm}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: "#3f51b5", color: "white", fontWeight: "bold" }}>
                    {editId ? "?? Edit Student" : "? Add New Student"}
                </DialogTitle>
                
                <DialogContent sx={{ paddingTop: "20px" }}>
                    <TextField
                        name="student_id"
                        label="Student ID"
                        value={form.student_id}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        placeholder="e.g., 2026/4795"
                        disabled={editId ? true : false}
                        helperText="Format: YYYY/XXXX"
                        variant="outlined"
                    />

                    <TextField
                        name="name"
                        label="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        placeholder="e.g., John Doe"
                        variant="outlined"
                    />

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Department</InputLabel>
                        <Select
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            label="Department"
                        >
                            <MenuItem value="">-- Select Department --</MenuItem>
                            {departments.map((dept) => (
                                <MenuItem key={dept.id} value={dept.department_name || dept.department_code}>
                                    {dept.department_name || dept.department_code}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        name="year"
                        label="Year"
                        value={form.year}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        type="number"
                        inputProps={{ min: "1", max: "5" }}
                        variant="outlined"
                    />

                    <TextField
                        name="personal_email"
                        label="Personal Email"
                        value={form.personal_email}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        type="email"
                        placeholder="e.g., student@email.com"
                        variant="outlined"
                    />

                    <TextField
                        name="phone_number"
                        label="Phone Number"
                        value={form.phone_number}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        placeholder="e.g., 09XXXXXXXX"
                        variant="outlined"
                    />

                    <TextField
                        name="emergency_contact"
                        label="Emergency Contact"
                        value={form.emergency_contact}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        placeholder="e.g., Emergency contact phone"
                        variant="outlined"
                    />

                    <Box sx={{ margin: "20px 0" }}>
                        <Typography variant="subtitle2" sx={{ marginBottom: "10px", fontWeight: "bold" }}>
                            ?? Student Photo
                        </Typography>
                        <input
                            type="file"
                            name="photo"
                            onChange={handleChange}
                            accept="image/*"
                            style={{ 
                                marginBottom: "10px", 
                                padding: "8px", 
                                cursor: "pointer",
                                width: "100%"
                            }}
                        />
                        {photoPreview && (
                            <Box sx={{ marginTop: "15px", textAlign: "center" }}>
                                <Typography variant="caption" sx={{ display: "block", marginBottom: "10px" }}>
                                    Preview:
                                </Typography>
                                <Avatar
                                    src={photoPreview}
                                    sx={{ width: 120, height: 120, margin: "0 auto" }}
                                />
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ padding: "15px", backgroundColor: "#f5f5f5" }}>
                    <Button 
                        onClick={clearForm}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={saveStudent}
                        variant="contained"
                        color="primary"
                        disabled={isLoading}
                    >
                        {isLoading ? "Saving..." : (editId ? "Update" : "Add")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
            >
                <DialogTitle sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                    ??? Delete Student
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ marginTop: "15px" }}>
                        Are you sure you want to delete this student? This action cannot be undone and will remove all associated data.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ padding: "15px" }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? (
                            <>
                                <CircularProgress size={18} sx={{ mr: 1, color: "white" }} />
                                Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Students Table */}
            <Typography variant="h6" sx={{ marginBottom: "15px", fontWeight: "bold" }}>
                ?? Students List ({filteredStudents.length})
            </Typography>

            <TableContainer component={Paper} sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#3f51b5" }}>
                            <TableCell sx={{ color: "white", fontWeight: "bold", width: "60px" }}>Photo</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Student ID</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Department</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Year</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Registration</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Status</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan="8" sx={{ textAlign: "center", padding: "40px" }}>
                                    <Typography sx={{ color: "#999", fontSize: "16px" }}>
                                        {students.length === 0 
                                            ? "No students in system yet" 
                                            : "No students match your search"}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow 
                                    key={student.id}
                                    hover
                                    sx={{
                                        backgroundColor: student.status === 'blocked' ? '#fff3e0' : 'transparent',
                                        opacity: student.status === 'blocked' ? 0.8 : 1,
                                        "&:hover": {
                                            backgroundColor: student.status === 'blocked' ? '#ffe0b2' : '#f5f5f5'
                                        }
                                    }}
                                >
                                    <TableCell>
                                        {student.photo ? (
                                            <Avatar
                                                src={`${API_URL}/uploads/${student.photo}`}
                                                sx={{ width: 50, height: 50 }}
                                                alt={student.username}
                                            />
                                        ) : (
                                            <Avatar sx={{ width: 50, height: 50, backgroundColor: "#ccc", color: "#666" }}>
                                                {(student.username || "?")[0].toUpperCase()}
                                            </Avatar>
                                        )}
                                    </TableCell>

                                    <TableCell sx={{ fontWeight: "bold" }}>
                                        {student.student_id}
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <Typography sx={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                {student.username || student.full_name || 'N/A'}
                                            </Typography>
                                            {student.personal_email && (
                                                <Typography sx={{ fontSize: '12px', color: '#666' }}>
                                                    ?? {student.personal_email}
                                                </Typography>
                                            )}
                                            {student.phone_number && (
                                                <Typography sx={{ fontSize: '12px', color: '#666' }}>
                                                    ?? {student.phone_number}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell>{student.department || "-"}</TableCell>

                                    <TableCell sx={{ textAlign: "center", fontWeight: "bold" }}>
                                        {student.year || "-"}
                                    </TableCell>

                                    <TableCell>
                                        <Typography sx={{ fontSize: "12px", color: "#999" }}>
                                            -
                                        </Typography>
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center" }}>
                                        <Chip
                                            icon={student.status === 'active' ? <CheckCircleIcon /> : <BlockIcon />}
                                            label={student.status === 'blocked' ? '?? Blocked' : '? Active'}
                                            color={student.status === 'active' ? 'success' : 'error'}
                                            variant="filled"
                                            size="small"
                                        />
                                    </TableCell>

                                    <TableCell sx={{ textAlign: "center" }}>
                                        <Box sx={{ display: "flex", gap: "5px", justifyContent: "center", flexWrap: "wrap" }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                startIcon={<EditIcon />}
                                                onClick={() => editStudent(student)}
                                                sx={{ fontSize: "11px", padding: "4px 8px" }}
                                            >
                                                Edit
                                            </Button>

                                            <Button
                                                size="small"
                                                variant="contained"
                                                color={student.status === 'blocked' ? 'warning' : 'error'}
                                                startIcon={student.status === 'blocked' ? <CheckCircleIcon /> : <BlockIcon />}
                                                onClick={() => toggleBlockStatus(student)}
                                                sx={{ fontSize: "11px", padding: "4px 8px" }}
                                            >
                                                {student.status === 'blocked' ? 'Unblock' : 'Block'}
                                            </Button>

                                            {userRole === "admin" && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => openDeleteDialog(student.id)}
                                                    sx={{ fontSize: "11px", padding: "4px 8px" }}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Footer Info */}
            <Box sx={{ marginTop: "30px", padding: "15px", backgroundColor: "white", borderRadius: "8px", textAlign: "center", border: "1px solid #eee" }}>
                <Typography variant="body2" sx={{ color: "#666" }}>
                    Total Students: <strong>{students.length}</strong> | 
                    Active: <strong>{students.filter(s => s.status === 'active').length}</strong> | 
                    Blocked: <strong>{students.filter(s => s.status === 'blocked').length}</strong>
                </Typography>
            </Box>
        </div>
    );
}

export default Students;

