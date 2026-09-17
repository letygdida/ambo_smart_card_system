import { API_URL } from '../config';

import React, { useEffect, useState } from 'react';
import SmartCardGenerator from './SmartCardGenerator';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Box,
    Tab,
    Tabs
} from "@mui/material";

function Registrations() {
    const [tabValue, setTabValue] = useState(0);
    const [registrations, setRegistrations] = useState([]);
    const [cardRequests, setCardRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [universityEmail, setUniversityEmail] = useState("");
    const [showCardGenerator, setShowCardGenerator] = useState(false);
    const [cardStudent, setCardStudent] = useState(null);

    // Get user role from localStorage
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    const fetchRegistrations = (status = "pending") => {
        setLoading(true);
        fetch(`${API_URL}/api/registrations/${status}`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            // Ensure data is always an array
            if (Array.isArray(data)) {
                setRegistrations(data);
            } else {
                console.error('API response is not an array:', data);
                setRegistrations([]);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error('Failed to fetch registrations:', err);
            setRegistrations([]); // Set empty array on error
            setLoading(false);
        });
    };

    useEffect(() => {
        const statusMap = ["pending", "approved", "rejected", "card-pending"];
        if (tabValue === 3) {
            // Card requests tab
            fetchCardRequests();
        } else {
            fetchRegistrations(statusMap[tabValue]);
        }
    }, [tabValue, token]);

    const fetchCardRequests = () => {
        setLoading(true);
        fetch(`${API_URL}/api/registrations/card-requests/pending`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(res => res.json())
        .then(data => {
            setCardRequests(Array.isArray(data) ? data : []);
            setLoading(false);
        })
        .catch(err => {
            console.error('Failed to fetch card requests:', err);
            setCardRequests([]);
            setLoading(false);
        });
    };

    const handleApproveCard = (student) => {
        if (window.confirm(`Approve smart card generation for ${student.full_name}?`)) {
            fetch(`${API_URL}/api/registrations/${student.id}/approve-card-request`, {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                }
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Card generation approved!");
                fetchCardRequests();
                // Refresh approved list
                if (tabValue === 1) {
                    fetchRegistrations("approved");
                }
            })
            .catch(err => alert("Error approving card generation"));
        }
    };

    const handleRejectCard = (student) => {
        const reason = prompt("Reason for rejecting card generation (optional):");
        if (reason !== null) {
            fetch(`${API_URL}/api/registrations/${student.id}/reject-card-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ reason: reason })
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Card generation rejected");
                fetchCardRequests();
                // Refresh approved list
                if (tabValue === 1) {
                    fetchRegistrations("approved");
                }
            })
            .catch(err => alert("Error rejecting card generation"));
        }
    };

    const handleRequestCard = (registration) => {
        if (window.confirm(`Submit card generation request for ${registration.full_name}?`)) {
            fetch(`${API_URL}/api/registrations/${registration.id}/request-card-admin`, {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert(data.message || "Card generation request submitted!");
                    fetchRegistrations("approved");
                }
            })
            .catch(err => alert("Error requesting card generation"));
        }
    };

    const handleApprove = (registration) => {
        setSelectedRegistration(registration);
        setUniversityEmail("");
        setDialogOpen(true);
    };

    const submitApproval = () => {
        // Use fixed registrar email for all students
        const registrarEmail = "registrar@ambou.edu.et";

        fetch(`${API_URL}/api/registrations/${selectedRegistration.id}/approve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ university_email: registrarEmail })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert("Registration approved successfully!\nUniversity Email: " + registrarEmail);
                setDialogOpen(false);
                fetchRegistrations("pending"); // Refresh list
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error approving registration");
        });
    };

    const handleReject = (registration) => {
        if (window.confirm(`Are you sure you want to reject ${registration.full_name}'s registration?`)) {
            fetch(`${API_URL}/api/registrations/${registration.id}/reject`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ rejection_reason: "Manual rejection" })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Registration rejected");
                    fetchRegistrations("pending"); // Refresh list
                }
            })
            .catch(err => {
                console.error(err);
                alert("Error rejecting registration");
            });
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return '#ff9800';
            case 'approved': return '#4caf50';
            case 'rejected': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    return (
        <div>
            <Typography variant="h4" fontWeight="bold">
                Student Registrations
            </Typography>
            
            <Typography color="gray">
                Manage student registration applications
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Pending" />
                    <Tab label="Approved" />
                    <Tab label="Rejected" />
                    <Tab label="Card Requests" />
                </Tabs>
            </Box>

            {loading ? (
                <Typography>Loading...</Typography>
            ) : tabValue === 3 ? (
                // Card Requests Tab
                <Grid container spacing={3}>
                    {cardRequests.map((student) => (
                        <Grid item xs={12} md={6} lg={4} key={student.id}>
                            <Card sx={{ borderRadius: "15px", boxShadow: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {student.full_name}
                                        </Typography>
                                        <Chip 
                                            label="CARD REQUEST" 
                                            sx={{ 
                                                backgroundColor: '#ff9800',
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </Box>
                                    
                                    <Typography><strong>Student ID:</strong> {student.student_id}</Typography>
                                    <Typography><strong>Department:</strong> {student.department}</Typography>
                                    <Typography><strong>Year:</strong> {student.year}</Typography>
                                    <Typography><strong>Email:</strong> {student.university_email}</Typography>
                                    <Typography><strong>Requested:</strong> {new Date(student.card_requested_at).toLocaleString()}</Typography>

                                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            size="small"
                                            onClick={() => handleApproveCard(student)}
                                        >
                                            Approve Card
                                        </Button>
                                        {userRole === "admin" && (
                                        <Button 
                                            variant="contained" 
                                            color="error" 
                                            size="small"
                                            onClick={() => handleRejectCard(student)}
                                        >
                                            Reject
                                        </Button>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    
                    {cardRequests.length === 0 && (
                        <Grid item xs={12}>
                            <Typography variant="h6" color="textSecondary" align="center">
                                No pending card requests
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            ) : (
                // Registration Tabs
                <Grid container spacing={3}>
                    {(registrations || []).map((registration) => (
                        <Grid item xs={12} md={6} lg={4} key={registration.id}>
                            <Card sx={{ borderRadius: "15px", boxShadow: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {registration.full_name}
                                        </Typography>
                                        <Chip 
                                            label={registration.registration_status.toUpperCase()} 
                                            sx={{ 
                                                backgroundColor: getStatusColor(registration.registration_status),
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </Box>
                                    
                                    <Typography><strong>Student ID:</strong> {registration.student_id}</Typography>
                                    <Typography><strong>Phone:</strong> {registration.phone_number}</Typography>
                                    <Typography><strong>Department:</strong> {registration.department}</Typography>
                                    <Typography><strong>Year:</strong> {registration.year}</Typography>
                                    <Typography><strong>Program:</strong> {registration.program}</Typography>
                                    <Typography><strong>Registered:</strong> {new Date(registration.registered_at).toLocaleString()}</Typography>
                                    
                                    {registration.approved_by && registration.approved_at && (
                                        <Typography sx={{ mt: 1 }} color="success.main">
                                            <strong>Approved By:</strong> {registration.approved_by} <br/>
                                            <strong>On:</strong> {new Date(registration.approved_at).toLocaleString()}
                                        </Typography>
                                    )}
                                    
                                    {registration.rejected_by && registration.rejected_at && (
                                        <Typography sx={{ mt: 1 }} color="error.main">
                                            <strong>Rejected By:</strong> {registration.rejected_by} <br/>
                                            <strong>On:</strong> {new Date(registration.rejected_at).toLocaleString()}
                                        </Typography>
                                    )}

                                    {registration.registration_status === 'pending' && (
                                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                                            <Button 
                                                variant="contained" 
                                                color="success" 
                                                size="small"
                                                onClick={() => handleApprove(registration)}
                                            >
                                                Approve
                                            </Button>
                                            {userRole === "admin" && (
                                            <Button 
                                                variant="contained" 
                                                color="error" 
                                                size="small"
                                                onClick={() => handleReject(registration)}
                                            >
                                                Reject
                                            </Button>
                                            )}
                                        </Box>
                                    )}

                                    {registration.registration_status === 'approved' && (
                                        <Box sx={{ mt: 2 }}>
                                            {!registration.card_request_status && (
                                                <Button 
                                                    variant="contained" 
                                                    color="primary" 
                                                    size="small"
                                                    onClick={() => handleRequestCard(registration)}
                                                    startIcon="??"
                                                >
                                                    Request Card Generation
                                                </Button>
                                            )}

                                            {registration.card_request_status === 'pending' && (
                                                <Chip 
                                                    label="CARD REQUEST PENDING" 
                                                    sx={{ 
                                                        backgroundColor: '#ff9800',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            )}

                                            {registration.card_request_status === 'approved' && (
                                                <>
                                                    {registration.smart_card_id ? (
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                            <Chip 
                                                                label={`? CARD GENERATED: ${registration.smart_card_id}`}
                                                                sx={{ 
                                                                    backgroundColor: '#4caf50',
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    flex: 1
                                                                }}
                                                            />
                                                            <Button 
                                                                variant="outlined" 
                                                                color="primary" 
                                                                size="small"
                                                                onClick={() => {
                                                                    setCardStudent(registration);
                                                                    setShowCardGenerator(true);
                                                                }}
                                                                sx={{ whiteSpace: 'nowrap' }}
                                                            >
                                                                ?? View Card
                                                            </Button>
                                                        </Box>
                                                    ) : (
                                                        <Button 
                                                            variant="contained" 
                                                            color="success" 
                                                            size="small"
                                                            onClick={() => {
                                                                setCardStudent(registration);
                                                                setShowCardGenerator(true);
                                                            }}
                                                            startIcon="??"
                                                        >
                                                            Generate Card
                                                        </Button>
                                                    )}
                                                </>
                                            )}

                                            {registration.card_request_status === 'rejected' && (
                                                <Chip 
                                                    label="CARD REQUEST REJECTED" 
                                                    sx={{ 
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    
                    {(registrations || []).length === 0 && (
                        <Grid item xs={12}>
                            <Typography variant="h6" color="textSecondary" align="center">
                                No {["pending", "approved", "rejected"][tabValue]} registrations found
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Approval Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Approve Registration: {selectedRegistration?.full_name}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        This student will be approved with the university registrar email.
                    </Typography>
                    <Box sx={{ 
                        bgcolor: '#e3f2fd', 
                        p: 2, 
                        borderRadius: 1,
                        border: '1px solid #2196f3'
                    }}>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                            ?? University Email (Auto-assigned):
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                            registrar@ambou.edu.et
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                        All approved students will use this registrar email for university records.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={submitApproval} variant="contained" color="success">
                        Approve Registration
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Smart Card Generator */}
            {showCardGenerator && cardStudent && (
                <SmartCardGenerator 
                    student={cardStudent} 
                    onClose={() => {
                        setShowCardGenerator(false);
                        setCardStudent(null);
                    }}
                />
            )}
        </div>
    );
}

export default Registrations;
