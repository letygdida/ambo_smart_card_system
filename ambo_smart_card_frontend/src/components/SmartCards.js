import { API_URL } from '../config';

import { useEffect, useState, useCallback } from "react";
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    TextField,
    Box,
    Paper,
    Avatar,
    Chip,
    InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SmartCardGenerator from "./SmartCardGenerator";
import CardPreview from "./CardPreview";

function SmartCards() {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showCardGenerator, setShowCardGenerator] = useState(false);
    
    const token = localStorage.getItem("token");

    const loadStudents = useCallback(() => {
        setLoading(true);
        fetch(`${API_URL}/api/students`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setStudents(data);
            } else {
                setStudents([]);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setStudents([]);
            setLoading(false);
        });
    }, [token]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    useEffect(() => {
        // Filter students based on search
        const filtered = students.filter(student => 
            (student.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (student.student_id || '').toLowerCase().includes(search.toLowerCase()) ||
            (student.department || '').toLowerCase().includes(search.toLowerCase())
        );
        setFilteredStudents(filtered);
    }, [students, search]);

    const handleGenerateCard = (student) => {
        setSelectedStudent(student);
        setShowCardGenerator(true);
    };

    const closeCardGenerator = () => {
        setShowCardGenerator(false);
        setSelectedStudent(null);
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={1}>
                🎓 Smart Card Generator
            </Typography>
            
            <Typography color="gray" mb={3}>
                Generate digital smart cards for students with QR codes and barcodes
            </Typography>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search by name, student ID, or department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {/* Statistics */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #1976d2, #42a5f5)' }}>
                        <CardContent>
                            <Typography variant="h4" color="white" fontWeight="bold">
                                {students.length}
                            </Typography>
                            <Typography color="white">
                                Total Students
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #388e3c, #66bb6a)' }}>
                        <CardContent>
                            <Typography variant="h4" color="white" fontWeight="bold">
                                {filteredStudents.length}
                            </Typography>
                            <Typography color="white">
                                Cards Available
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #f57c00, #ffb74d)' }}>
                        <CardContent>
                            <Typography variant="h4" color="white" fontWeight="bold">
                                2026
                            </Typography>
                            <Typography color="white">
                                Current Year
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Show Card Generator if Selected */}
            {showCardGenerator && selectedStudent ? (
                <SmartCardGenerator 
                    student={selectedStudent} 
                    onClose={closeCardGenerator}
                />
            ) : (
                <>
                    {/* Student Cards Grid */}
                    <Typography variant="h5" fontWeight="bold" mb={2}>
                        Select Student for Card Generation
                    </Typography>
                    
                    {loading ? (
                        <Box textAlign="center" py={4}>
                            <Typography>Loading students...</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredStudents.map((student) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                                    <Card 
                                        sx={{ 
                                            borderRadius: 3, 
                                            boxShadow: 3,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 6
                                            },
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleGenerateCard(student)}
                                    >
                                        <CardContent>
                                            {/* Student Photo */}
                                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                                {student.photo ? (
                                                    <Avatar
                                                        src={`${API_URL}/uploads/${student.photo}`}
                                                        sx={{ width: 80, height: 80, mx: 'auto', border: '3px solid #1976d2' }}
                                                    />
                                                ) : (
                                                    <Avatar sx={{ width: 80, height: 80, mx: 'auto', bgcolor: '#1976d2', fontSize: '2rem' }}>
                                                        {(student.name || 'N').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                )}
                                            </Box>

                                            {/* Student Info */}
                                            <Typography variant="h6" fontWeight="bold" textAlign="center" mb={1}>
                                                {student.name}
                                            </Typography>
                                            
                                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                                <Chip 
                                                    label={student.student_id} 
                                                    color="primary" 
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>

                                            <Typography color="textSecondary" textAlign="center" mb={1}>
                                                <strong>Department:</strong> {student.department}
                                            </Typography>
                                            
                                            <Typography color="textSecondary" textAlign="center" mb={2}>
                                                <strong>Year:</strong> {student.year}
                                            </Typography>

                                            {/* Generate Button */}
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="success"
                                                sx={{ 
                                                    fontWeight: 'bold',
                                                    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #388e3c, #4caf50)'
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleGenerateCard(student);
                                                }}
                                            >
                                                🎓 Generate Smart Card
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                            
                            {filteredStudents.length === 0 && !loading && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="h6" color="textSecondary">
                                            {search ? 'No students found matching your search' : 'No students available'}
                                        </Typography>
                                        {search && (
                                            <Button 
                                                variant="outlined" 
                                                onClick={() => setSearch('')}
                                                sx={{ mt: 2 }}
                                            >
                                                Clear Search
                                            </Button>
                                        )}
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {/* Instructions */}
                    <CardPreview />
                    
                    <Paper sx={{ p: 3, mt: 4, background: '#f8f9fa' }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            📋 Smart Card Features
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" mb={1}>
                                    <strong>🎯 Front Side:</strong>
                                </Typography>
                                <Typography variant="body2" color="textSecondary" mb={2}>
                                    • Student photo and information<br/>
                                    • University logo and details<br/>
                                    • QR Code with student data<br/>
                                    • Professional design matching university standards
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" mb={1}>
                                    <strong>🏷️ Back Side:</strong>
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    • Detailed student information<br/>
                                    • Barcode with student ID<br/>
                                    • Department and program details<br/>
                                    • Scannable for attendance systems
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </>
            )}
        </Box>
    );
}

export default SmartCards;