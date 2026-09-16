import { useState } from "react";
import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Paper,
    AppBar,
    Toolbar,
    CssBaseline
} from "@mui/material";
import { School, Person, Lock, CreditCard } from "@mui/icons-material";

function HomePage() {
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    return (
        <>
            <CssBaseline />
            {/* Navigation Bar */}
            <AppBar position="static" sx={{ background: "linear-gradient(45deg, #1976d2 30%, #21cbf3 90%)" }}>
                <Toolbar>
                    <Box
                        component="img"
                        src="/images/ambo-university-logo.png"
                        alt="Ambo University"
                        sx={{ height: 45, objectFit: "contain", mr: 2 }}
                    />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
                        Smart Card Management System
                    </Typography>
                    <Button color="inherit" href="/login" sx={{ mr: 2 }}>
                        Login
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => (window.location.href = "/register")}
                    >
                        Register
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Hero Section */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    py: 8,
                    textAlign: "center"
                }}
            >
                <Container>
                    <Box
                        component="img"
                        src="/images/ambo-university-logo.png"
                        alt="Ambo University"
                        sx={{
                            height: { xs: 70, md: 90 },
                            objectFit: "contain",
                            display: "block",
                            mx: "auto",
                            mb: 2
                        }}
                    />
                    <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
                        Smart Card Management System for Students
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="large"
                            onClick={() => (window.location.href = "/register")}
                            sx={{ px: 4, py: 1.5, fontSize: "16px" }}
                        >
                            Register Now
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: "16px",
                                borderColor: "white",
                                color: "white",
                                "&:hover": {
                                    borderColor: "white",
                                    backgroundColor: "rgba(255,255,255,0.1)"
                                }
                            }}
                            href="/login"
                        >
                            Login
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Features Section */}
            <Container sx={{ py: 8 }}>
                <Typography variant="h4" sx={{ textAlign: "center", mb: 6, fontWeight: "bold" }}>
                    System Features
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 3, textAlign: "center", cursor: "pointer", transition: "0.3s", "&:hover": { boxShadow: 5, transform: "translateY(-5px)" } }}>
                            <School sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                Student Registration
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Easy self-registration with all required information
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 3, textAlign: "center", cursor: "pointer", transition: "0.3s", "&:hover": { boxShadow: 5, transform: "translateY(-5px)" } }}>
                            <CreditCard sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                Smart Card Management
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Generate and manage student smart cards with QR codes
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 3, textAlign: "center", cursor: "pointer", transition: "0.3s", "&:hover": { boxShadow: 5, transform: "translateY(-5px)" } }}>
                            <Person sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                Profile Management
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Update and manage your student profile anytime
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 3, textAlign: "center", cursor: "pointer", transition: "0.3s", "&:hover": { boxShadow: 5, transform: "translateY(-5px)" } }}>
                            <Lock sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                Secure System
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Secure authentication and data protection
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Registration Steps Section */}
            <Box sx={{ background: "#f5f5f5", py: 8 }}>
                <Container>
                    <Typography variant="h4" sx={{ textAlign: "center", mb: 6, fontWeight: "bold" }}>
                        How to Register
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ textAlign: "center", p: 3 }}>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: "50%",
                                        background: "primary.main",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                        fontSize: 24,
                                        fontWeight: "bold"
                                    }}
                                >
                                    1
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                    Personal Info
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Enter your personal details and contact information
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ textAlign: "center", p: 3 }}>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: "50%",
                                        background: "primary.main",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                        fontSize: 24,
                                        fontWeight: "bold"
                                    }}
                                >
                                    2
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                    Academic Info
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Provide your academic details and department
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ textAlign: "center", p: 3 }}>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: "50%",
                                        background: "primary.main",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                        fontSize: 24,
                                        fontWeight: "bold"
                                    }}
                                >
                                    3
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                    Emergency Contact
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Add emergency contact details
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ textAlign: "center", p: 3 }}>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: "50%",
                                        background: "primary.main",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                        fontSize: 24,
                                        fontWeight: "bold"
                                    }}
                                >
                                    4
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                    Documents & Password
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Upload photos and set your password
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ background: "#333", color: "white", py: 4, textAlign: "center" }}>
                <Container>
                    <Typography variant="body2">
                        © 2026 Ambo University. All rights reserved.
                    </Typography>
                    <Typography variant="caption">
                        Smart Card Management System v1.0
                    </Typography>
                </Container>
            </Box>
        </>
    );
}

export default HomePage;
