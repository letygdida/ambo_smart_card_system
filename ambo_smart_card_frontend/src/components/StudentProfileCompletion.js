import { API_URL } from '../config';

import { useState } from "react";
import {
    Stepper,
    Step,
    StepLabel,
    Button,
    TextField,
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Avatar,
    Grid
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function StudentProfileCompletion() {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [idDocumentPreview, setIdDocumentPreview] = useState(null);
    const navigate = useNavigate();

    const steps = [
        "Personal Information",
        "Academic Information",
        "Emergency Contact",
        "Review & Submit"
    ];

    const [formData, setFormData] = useState({
        // Personal Information
        full_name: "",
        personal_email: "",
        phone_number: "",
        gender: "",
        date_of_birth: "",
        nationality: "",
        region: "",
        zone: "",
        woreda: "",
        address: "",

        // Academic Information
        campus: "",
        school: "",
        department: "",
        program: "Regular",
        year: "",
        semester: "",
        section: "",

        // Emergency Contact
        emergency_contact_name: "",
        emergency_contact_relationship: "",
        emergency_contact_phone: "",
        emergency_contact_address: "",

        // ID Document
        id_document: null
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const token = localStorage.getItem("token");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            setFormData(prev => ({
                ...prev,
                [name]: file
            }));

            if (name === 'id_document') {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setIdDocumentPreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const validateStep = (stepIndex) => {
        const newErrors = {};

        if (stepIndex === 0) {
            if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
            if (!formData.phone_number.trim()) newErrors.phone_number = "Phone number is required";
            if (!formData.gender) newErrors.gender = "Gender is required";

            const phoneDigits = formData.phone_number.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                newErrors.phone_number = "Phone number must be at least 10 digits";
            }
        }

        if (stepIndex === 1) {
            if (!formData.department.trim()) newErrors.department = "Department is required";
            if (!formData.year) newErrors.year = "Year is required";
        }

        if (stepIndex === 2) {
            if (!formData.emergency_contact_name.trim()) newErrors.emergency_contact_name = "Contact name is required";
            if (!formData.emergency_contact_relationship) newErrors.emergency_contact_relationship = "Relationship is required";
            if (!formData.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = "Contact phone is required";
        }

        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep(prev => prev + 1);
            setError("");
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(activeStep)) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formDataToSend = new FormData();

            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'id_document' && formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add files
            if (formData.id_document) {
                formDataToSend.append('id_document', formData.id_document);
            }

            const response = await fetch('\/api/auth/complete-profile', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Profile completion failed");
                setLoading(false);
                return;
            }

            setSuccess(true);
            setLoading(false);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);

        } catch (err) {
            setError("Network error: " + err.message);
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Card>
                <CardContent>
                    <Typography variant="h4" sx={{ mb: 3, textAlign: "center", fontWeight: "bold" }}>
                        Complete Your Profile
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}>
                        Please fill in your complete information to continue
                    </Typography>

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Profile completed successfully! Redirecting to dashboard...
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <Box sx={{ minHeight: 400 }}>
                        {/* Step 0: Personal Information */}
                        {activeStep === 0 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Full Name"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                            error={!!fieldErrors.full_name}
                                            helperText={fieldErrors.full_name}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Personal Email (Optional)"
                                            name="personal_email"
                                            type="email"
                                            value={formData.personal_email}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone Number"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleInputChange}
                                            error={!!fieldErrors.phone_number}
                                            helperText={fieldErrors.phone_number}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={!!fieldErrors.gender}>
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
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Date of Birth"
                                            name="date_of_birth"
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={handleInputChange}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Nationality"
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Region"
                                            name="region"
                                            value={formData.region}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Zone"
                                            name="zone"
                                            value={formData.zone}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Woreda"
                                            name="woreda"
                                            value={formData.woreda}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            name="address"
                                            multiline
                                            rows={3}
                                            value={formData.address}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Step 1: Academic Information */}
                        {activeStep === 1 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>Academic Information</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Campus"
                                            name="campus"
                                            value={formData.campus}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="School"
                                            name="school"
                                            value={formData.school}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            error={!!fieldErrors.department}
                                            helperText={fieldErrors.department}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Program</InputLabel>
                                            <Select
                                                name="program"
                                                value={formData.program}
                                                onChange={handleInputChange}
                                                label="Program"
                                            >
                                                <MenuItem value="Regular">Regular</MenuItem>
                                                <MenuItem value="Extension">Extension</MenuItem>
                                                <MenuItem value="Distance">Distance</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth error={!!fieldErrors.year}>
                                            <InputLabel>Year</InputLabel>
                                            <Select
                                                name="year"
                                                value={formData.year}
                                                onChange={handleInputChange}
                                                label="Year"
                                            >
                                                <MenuItem value="1">Year 1</MenuItem>
                                                <MenuItem value="2">Year 2</MenuItem>
                                                <MenuItem value="3">Year 3</MenuItem>
                                                <MenuItem value="4">Year 4</MenuItem>
                                                <MenuItem value="5">Year 5</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Semester</InputLabel>
                                            <Select
                                                name="semester"
                                                value={formData.semester}
                                                onChange={handleInputChange}
                                                label="Semester"
                                            >
                                                <MenuItem value="1">Semester 1</MenuItem>
                                                <MenuItem value="2">Semester 2</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            label="Section"
                                            name="section"
                                            value={formData.section}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Step 2: Emergency Contact */}
                        {activeStep === 2 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>Emergency Contact Information</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Parent/Guardian Name"
                                            name="emergency_contact_name"
                                            value={formData.emergency_contact_name}
                                            onChange={handleInputChange}
                                            error={!!fieldErrors.emergency_contact_name}
                                            helperText={fieldErrors.emergency_contact_name}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={!!fieldErrors.emergency_contact_relationship}>
                                            <InputLabel>Relationship</InputLabel>
                                            <Select
                                                name="emergency_contact_relationship"
                                                value={formData.emergency_contact_relationship}
                                                onChange={handleInputChange}
                                                label="Relationship"
                                            >
                                                <MenuItem value="Father">Father</MenuItem>
                                                <MenuItem value="Mother">Mother</MenuItem>
                                                <MenuItem value="Sister">Sister</MenuItem>
                                                <MenuItem value="Brother">Brother</MenuItem>
                                                <MenuItem value="Guardian">Guardian</MenuItem>
                                                <MenuItem value="Other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone Number"
                                            name="emergency_contact_phone"
                                            value={formData.emergency_contact_phone}
                                            onChange={handleInputChange}
                                            error={!!fieldErrors.emergency_contact_phone}
                                            helperText={fieldErrors.emergency_contact_phone}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            name="emergency_contact_address"
                                            multiline
                                            rows={3}
                                            value={formData.emergency_contact_address}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Step 3: Review & Submit */}
                        {activeStep === 3 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>Review Your Information</Typography>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Please review all your information before submitting. You can go back to edit any section.
                                </Alert>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ border: "2px dashed #ccc", borderRadius: 2, p: 2, textAlign: "center" }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>ID Document</Typography>
                                            {idDocumentPreview ? (
                                                <Avatar
                                                    src={idDocumentPreview}
                                                    sx={{ width: 100, height: 100, mx: "auto", mb: 1 }}
                                                />
                                            ) : (
                                                <>
                                                    <input
                                                        type="file"
                                                        name="id_document"
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                        style={{ display: "none" }}
                                                        id="id-document-input"
                                                    />
                                                    <label htmlFor="id-document-input" style={{ cursor: "pointer" }}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Click to upload ID/Letter (Optional)
                                                        </Typography>
                                                    </label>
                                                </>
                                            )}
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Personal Information:</Typography>
                                        <Typography variant="body2">Name: {formData.full_name}</Typography>
                                        <Typography variant="body2">Phone: {formData.phone_number}</Typography>
                                        <Typography variant="body2">Email: {formData.personal_email}</Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Academic Information:</Typography>
                                        <Typography variant="body2">Department: {formData.department}</Typography>
                                        <Typography variant="body2">Year: {formData.year}</Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Emergency Contact:</Typography>
                                        <Typography variant="body2">Name: {formData.emergency_contact_name}</Typography>
                                        <Typography variant="body2">Relationship: {formData.emergency_contact_relationship}</Typography>
                                        <Typography variant="body2">Phone: {formData.emergency_contact_phone}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Box>

                    {/* Navigation Buttons */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                        <Button
                            disabled={activeStep === 0 || loading}
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : "Submit Profile"}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                >
                                    Next
                                </Button>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default StudentProfileCompletion;
