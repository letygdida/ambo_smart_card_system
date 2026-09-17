import { API_URL } from '../config';
import { getToken } from '../auth';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';

function AdminSettings() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);

  // Profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    department: ''
  });

  // Password states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Settings states
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    darkMode: false,
    autoLogout: true,
    autoLogoutMinutes: 30
  });

  const token = getToken();
  const userRole = localStorage.getItem('role');

  // Fetch admin data on mount
  useEffect(() => {
    if (userRole === 'admin') {
      fetchAdminData();
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const data = await response.json();
      setAdminData(data);
      setProfileData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        department: data.department || ''
      });
    } catch (err) {
      setError(`Error fetching admin data: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!profileData.full_name || !profileData.email) {
        setError('Full name and email are required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setSuccess('? Profile updated successfully');
      setAdminData(data);
      setIsEditingProfile(false);

      // Clear message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`? ${err.message}`);
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError('All password fields are required');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to change password');
      }

      setSuccess('? Password changed successfully');
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`? ${err.message}`);
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update settings
  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update settings');
      }

      setSuccess('? Settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`? ${err.message}`);
      console.error('Settings update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile field change
  const handleProfileChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  // Handle password field change
  const handlePasswordChange = (field, value) => {
    setPasswordData({
      ...passwordData,
      [field]: value
    });
  };

  // Handle settings toggle
  const handleSettingToggle = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  if (userRole !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You do not have permission to access admin settings
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        ?? Admin Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading && !adminData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {adminData && (
        <Box>
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="?? Profile" icon={<PersonIcon />} iconPosition="start" />
              <Tab label="?? Password & Security" icon={<LockIcon />} iconPosition="start" />
              <Tab label="?? System Settings" icon={<SettingsIcon />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* TAB 0: PROFILE */}
          {tabValue === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Admin Profile Information
                </Typography>

                {!isEditingProfile ? (
                  <Box>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                          <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                            Full Name
                          </Typography>
                          <Typography variant="h6">
                            {profileData.full_name || 'Not set'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                          <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                            Email
                          </Typography>
                          <Typography variant="h6">
                            {profileData.email || 'Not set'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                          <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                            Phone
                          </Typography>
                          <Typography variant="h6">
                            {profileData.phone_number || 'Not set'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                          <Typography variant="caption" sx={{ color: 'textSecondary' }}>
                            Department
                          </Typography>
                          <Typography variant="h6">
                            {profileData.department || 'Not set'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit Profile
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={profileData.full_name}
                          onChange={(e) => handleProfileChange('full_name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={profileData.phone_number}
                          onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          value={profileData.department}
                          onChange={(e) => handleProfileChange('department', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<SaveIcon />}
                            onClick={handleUpdateProfile}
                            disabled={loading}
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfileData({
                                full_name: adminData.full_name || '',
                                email: adminData.email || '',
                                phone_number: adminData.phone_number || '',
                                department: adminData.department || ''
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 1: PASSWORD & SECURITY */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              {/* Change Password Card */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      ?? Change Password
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: 'textSecondary' }}>
                      Update your password to keep your account secure
                    </Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<LockIcon />}
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      Change Password
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Security Info Card */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      ??? Security Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Last Login:</strong> {adminData?.last_login || 'Never'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Account Status:</strong> Active ?
                      </Typography>
                      <Typography variant="body2">
                        <strong>Role:</strong> Administrator
                      </Typography>
                      <Typography variant="body2">
                        <strong>Account Created:</strong> {adminData?.created_at || 'Unknown'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 2: SYSTEM SETTINGS */}
          {tabValue === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  ?? System Settings
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Notifications</Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={() => handleSettingToggle('emailNotifications')}
                        />
                      }
                      label="?? Email Notifications"
                    />
                    <Typography variant="caption" sx={{ display: 'block', ml: 4, color: 'textSecondary' }}>
                      Receive email notifications for important events
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.smsNotifications}
                          onChange={() => handleSettingToggle('smsNotifications')}
                        />
                      }
                      label="?? SMS Notifications"
                    />
                    <Typography variant="caption" sx={{ display: 'block', ml: 4, color: 'textSecondary' }}>
                      Receive SMS alerts for critical issues
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="subtitle2">Security</Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.twoFactorAuth}
                          onChange={() => handleSettingToggle('twoFactorAuth')}
                        />
                      }
                      label="?? Two-Factor Authentication"
                    />
                    <Typography variant="caption" sx={{ display: 'block', ml: 4, color: 'textSecondary' }}>
                      Enable extra security layer for login
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="subtitle2">Display & Behavior</Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.darkMode}
                          onChange={() => handleSettingToggle('darkMode')}
                        />
                      }
                      label="?? Dark Mode"
                    />
                    <Typography variant="caption" sx={{ display: 'block', ml: 4, color: 'textSecondary' }}>
                      Enable dark theme for the interface
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoLogout}
                          onChange={() => handleSettingToggle('autoLogout')}
                        />
                      }
                      label="?? Auto-Logout"
                    />
                    <Typography variant="caption" sx={{ display: 'block', ml: 4, color: 'textSecondary' }}>
                      Automatically logout after inactivity
                    </Typography>
                  </Grid>

                  {settings.autoLogout && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        label="Logout Timeout (minutes)"
                        value={settings.autoLogoutMinutes}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoLogoutMinutes: parseInt(e.target.value)
                        })}
                        inputProps={{ min: 5, max: 120 }}
                        fullWidth
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleUpdateSettings}
                      disabled={loading}
                    >
                      Save Settings
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>?? Change Password</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            margin="normal"
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current
                  })}
                >
                  {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </Button>
              )
            }}
          />

          <TextField
            fullWidth
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            margin="normal"
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new
                  })}
                >
                  {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </Button>
              )
            }}
            helperText="Minimum 6 characters"
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            margin="normal"
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm
                  })}
                >
                  {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </Button>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowPasswordDialog(false);
            setPasswordData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
            setError('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminSettings;


