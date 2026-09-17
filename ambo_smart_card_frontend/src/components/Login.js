import { API_URL } from '../config';
import { setSession } from '../auth';

import { useState } from "react";

import {
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    IconButton,
    InputAdornment,
    Alert,
    Box,
    Divider,
    Link
} from "@mui/material";

import {
    Visibility,
    VisibilityOff
} from "@mui/icons-material";

import StudentRegistration from "./StudentRegistration";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username.trim(),
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.token) {
                // Store token and user info using centralized auth helper
                setSession(data.token, data.role, data.username, data.student_id);

                console.log("Login successful - Role:", data.role);

                // Redirect based on role
                if (data.role === "admin" || data.role === "staff") {
                    window.location.href = "/dashboard";
                } else if (data.role === "student") {
                    window.location.href = "/dashboard";
                } else {
                    window.location.href = "/dashboard";
                }
            } else {
                setError(data.message || "Invalid username or password");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Server connection failed. Please check if the server is running.");
        } finally {
            setLoading(false);
        }
    };

    if (showRegistration) {
        return <StudentRegistration onClose={() => setShowRegistration(false)} />;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
                            Smart Card Management System
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Link
                        href="/register"
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
                        Register
                    </Link>
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
                        Login
                    </Button>
                </Box>
            </Box>

            {/* MAIN CONTENT */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
                <Card
                    sx={{
                        width: "100%",
                        maxWidth: "400px",
                        padding: "30px",
                        borderRadius: "15px",
                        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                        backdropFilter: "blur(4px)"
                    }}
                >
                    <CardContent>
                        {/* University Logo */}
                        <Box
                            component="img"
                            src="/images/ambo-university-logo.png"
                            alt="Ambo University"
                            sx={{
                                width: "100%",
                                maxHeight: 100,
                                objectFit: "contain",
                                display: "block",
                                mx: "auto",
                                mb: 2
                            }}
                        />

                        {/* Title */}
                        <Typography
                            variant="h5"
                            align="center"
                            sx={{
                                marginBottom: "10px",
                                fontWeight: "bold",
                                color: "#333"
                            }}
                        >
                            Smart Card Management System
                        </Typography>

                        <Typography
                            variant="body2"
                            align="center"
                            sx={{
                                marginBottom: "25px",
                                color: "#666"
                            }}
                        >
                            Sign in to your account
                        </Typography>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ marginBottom: "20px" }}>
                                {error}
                            </Alert>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin}>
                            {/* Username Field */}
                            <TextField
                                fullWidth
                                label="Username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                sx={{
                                    marginBottom: "20px",
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": {
                                            borderColor: "#ddd"
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#667eea"
                                        }
                                    }
                                }}
                                placeholder="Enter your username"
                                disabled={loading}
                            />

                            {/* Password Field */}
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                disabled={loading}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    marginBottom: "25px",
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": {
                                            borderColor: "#ddd"
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#667eea"
                                        }
                                    }
                                }}
                                placeholder="Enter your password"
                                disabled={loading}
                            />

                            {/* Login Button */}
                            <Button
                                fullWidth
                                variant="contained"
                                type="submit"
                                disabled={loading || !username || !password}
                                sx={{
                                    padding: "12px",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    "&:hover": {
                                        background: "linear-gradient(135deg, #5568d3 0%, #663a99 100%)"
                                    },
                                    "&:disabled": {
                                        background: "#ccc"
                                    }
                                }}
                            >
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span>Logging in...</span>
                                    </span>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <Divider sx={{ my: 2.5 }}>OR</Divider>

                        {/* Register Section */}
                        <Box sx={{ textAlign: "center" }}>
                            <Typography variant="body2" sx={{ mb: 1.5, color: "#666" }}>
                                New Student?
                            </Typography>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="primary"
                                onClick={() => setShowRegistration(true)}
                                sx={{
                                    padding: "10px",
                                    fontWeight: "bold",
                                    borderColor: "#667eea",
                                    color: "#667eea",
                                    "&:hover": {
                                        borderColor: "#764ba2",
                                        backgroundColor: "rgba(102, 126, 234, 0.04)"
                                    }
                                }}
                                disabled={loading}
                            >
                                Register Here
                            </Button>
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

export default Login;
