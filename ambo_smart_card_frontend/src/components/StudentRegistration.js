import { API_URL } from '../config';

import { useState } from "react";
import {
    Button,
    TextField,
    Box,
    Typography,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Link
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function StudentRegistration({ onClose }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};

        if (!username.trim()) {
            newErrors.username = "Username is required";
        } else if (username.trim().length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Confirm password is required";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            console.log("Sending registration data:", { username: username.trim(), password: "***", confirm_password: "***" });

            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                    confirm_password: confirmPassword
                })
            });

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);

            if (!response.ok) {
                setError(data.error || "Account creation failed");
                setLoading(false);
                return;
            }

            setSuccess(true);
            setLoading(false);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err) {
            console.error("Registration error:", err);
            setError("Network error: " + err.message);
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        if (field === "username") setUsername(value);
        if (field === "password") setPassword(value);
        if (field === "confirmPassword") setConfirmPassword(value);

        // Clear error for this field
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
            {/* HEADER */}
            <Box sx={{ 
                background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 100%)',
                color: 'white',
                padding: '20px 40px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        component="img"
                        src="/images/ambo-university-logo.png"
                        alt="Ambo University"
                        sx={{
                            height: 50,
                            width: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                    <Box>
                        <Typography sx={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                            Ambo University
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                            Student Registration Portal
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        sx={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontSize: '12px',
                            padding: '8px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.3)'
                            }
                        }}
                    >
                        Register
                    </Button>
                    <Link
                        href="/login"
                        sx={{
                            color: '#ffffff',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        Login
                    </Link>
                </Box>
            </Box>

            {/* MAIN CONTENT */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
                <Card sx={{ width: "100%", maxWidth: 400 }}>
                    <CardContent>
                        <Typography variant="h5" sx={{ mb: 1, textAlign: "center", fontWeight: "bold" }}>
                            Student Account Creation
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}>
                            Create your account to get started
                        </Typography>

                        {success && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Account created successfully! Redirecting to login...
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Username"
                                name="username"
                                value={username}
                                onChange={(e) => handleInputChange("username", e.target.value)}
                                error={!!fieldErrors.username}
                                helperText={fieldErrors.username}
                                placeholder="Enter a unique username"
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                error={!!fieldErrors.password}
                                helperText={fieldErrors.password || "Minimum 8 characters"}
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                error={!!fieldErrors.confirmPassword}
                                helperText={fieldErrors.confirmPassword}
                                disabled={loading}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ py: 1.5, mt: 2 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : "Create Account"}
                            </Button>

                            <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }}>
                                Already have an account?{" "}
                                <Link href="/login" underline="hover" sx={{ cursor: "pointer" }}>
                                    Login here
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* FOOTER */}
            <Box sx={{ 
                background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                color: 'white',
                padding: '20px 40px',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.2)'
            }}>
                <Typography sx={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', mb: 0.5 }}>
                    © 2026 Ambo University - Smart Card Management System
                </Typography>
                <Typography sx={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    For technical support, contact IT Department | Version 1.0
                </Typography>
            </Box>
        </Box>
    );
}

export default StudentRegistration;
