import { API_URL } from '../config';
import { getToken } from '../auth';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';

const EditProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    // Form data
    const [formData, setFormData] = useState({
        full_name: '',
        personal_email: '',
        phone_number: '',
        gender: '',
        date_of_birth: '',
        nationality: 'Ethiopia',
        region: '',
        zone: '',
        woreda: '',
        address: '',
        campus: '',
        school: '',
        department: '',
        program: '',
        year: '',
        semester: '',
        section: '',
        emergency_contact_name: '',
        emergency_contact_relationship: '',
        emergency_contact_phone: '',
        emergency_contact_address: ''
    });

    // Photo handling
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [idDocFile, setIdDocFile] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const token = getToken();
            
            if (!token) {
                setError('Please login first');
                setLoading(false);
                return;
            }

            console.log('Loading profile with token:', token.substring(0, 20) + '...');

            const response = await fetch(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Profile response status:', response.status);
            
            const responseText = await response.text();
            console.log('Profile response text:', responseText);

            if (!response.ok) {
                let errorMessage = 'Failed to load profile';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Parse JSON response
            const data = JSON.parse(responseText);
            console.log('Profile data loaded:', data);

            setProfile(data);
            
            // Convert date format if needed (from YYYY-MM-DD to input format)
            const dob = data.date_of_birth ? data.date_of_birth.split('T')[0] : '';
            
            setFormData({
                full_name: data.full_name || '',
                personal_email: data.personal_email || '',
                phone_number: data.phone_number || '',
                gender: data.gender || '',
                date_of_birth: dob,
                nationality: data.nationality || 'Ethiopia',
                region: data.region || '',
                zone: data.zone || '',
                woreda: data.woreda || '',
                address: data.address || '',
                campus: data.campus || '',
                school: data.school || '',
                department: data.department || '',
                program: data.program || '',
                year: data.year || '',
                semester: data.semester || '',
                section: data.section || '',
                emergency_contact_name: data.emergency_contact_name || '',
                emergency_contact_relationship: data.emergency_contact_relationship || '',
                emergency_contact_phone: data.emergency_contact_phone || '',
                emergency_contact_address: data.emergency_contact_address || ''
            });

            // Set photo preview if exists
            if (data.photo) {
                setPhotoPreview(`${API_URL}/uploads/registrations/${data.photo}`);
            }

            setLoading(false);
            setError(''); // Clear any previous errors
            
        } catch (err) {
            console.error('Error loading profile:', err);
            setError('Failed to load profile: ' + err.message);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setError('Photo must be less than 10MB');
                return;
            }

            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleIdDocChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setError('ID document must be less than 10MB');
                return;
            }

            setIdDocFile(file);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const token = getToken();
            
            if (!token) {
                throw new Error('Please login again');
            }

            const formDataToSend = new FormData();

            // Append all form fields (only non-empty values)
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (value !== null && value !== undefined && value !== '') {
                    formDataToSend.append(key, value);
                }
            });

            // Append photo if selected
            if (photoFile) {
                formDataToSend.append('photo', photoFile);
                console.log('Uploading photo:', photoFile.name);
            }

            // Append ID document if selected
            if (idDocFile) {
                formDataToSend.append('id_document', idDocFile);
                console.log('Uploading ID document:', idDocFile.name);
            }

            console.log('Submitting profile update...');

            const response = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                    // Don't set Content-Type - browser will set it automatically with boundary for multipart
                },
                body: formDataToSend
            });

            console.log('Response status:', response.status);

            // Get response text first
            const responseText = await response.text();
            console.log('Response text:', responseText);

            // Check if response is ok
            if (!response.ok) {
                let errorMessage = 'Failed to update profile';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Try to parse JSON response
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                // If response is not JSON, treat as success
                data = { message: 'Profile updated successfully!' };
            }

            setMessage(data.message || 'Profile updated successfully!');
            setError(''); // Clear any errors
            
            // Store a flag to trigger dashboard refresh
            localStorage.setItem('profileUpdated', 'true');
            
            // Reload profile to show updated data
            setTimeout(() => {
                loadProfile();
                setPhotoFile(null);
                setIdDocFile(null);
                // Scroll to top to see success message
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Navigate to dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }, 1500);

        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile. Please try again.');
            // Scroll to top to see error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="edit-profile-container">
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="edit-profile-container">
            <div className="profile-header">
                <h2>Edit My Profile</h2>
                <p className="subtitle">Update your personal information and photo</p>
            </div>

            {message && (
                <div className="alert alert-success">
                    <i className="fas fa-check-circle"></i> {message}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                {/* Photo Upload Section */}
                <div className="form-section photo-section">
                    <h3>Profile Photo</h3>
                    <div className="photo-upload-area">
                        <div className="photo-preview-container">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Profile" className="photo-preview" />
                            ) : (
                                <div className="photo-placeholder">
                                    <i className="fas fa-user"></i>
                                    <p>No photo</p>
                                </div>
                            )}
                        </div>
                        <div className="photo-upload-controls">
                            <label htmlFor="photo-input" className="btn btn-secondary">
                                <i className="fas fa-camera"></i> Choose Photo
                            </label>
                            <input
                                type="file"
                                id="photo-input"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                style={{ display: 'none' }}
                            />
                            <p className="file-info">
                                {photoFile ? photoFile.name : 'JPG, PNG, GIF (Max 10MB)'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="form-section">
                    <h3>Personal Information</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Student ID</label>
                            <input
                                type="text"
                                value={profile?.student_id || ''}
                                disabled
                                className="form-control disabled"
                            />
                        </div>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={profile?.username || ''}
                                disabled
                                className="form-control disabled"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name <span className="required">*</span></label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Gender <span className="required">*</span></label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleInputChange}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Nationality</label>
                            <input
                                type="text"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="e.g., Ethiopia"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="form-section">
                    <h3>Contact Information</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>University Email</label>
                            <input
                                type="email"
                                value={profile?.university_email || ''}
                                disabled
                                className="form-control disabled"
                            />
                        </div>
                        <div className="form-group">
                            <label>Personal Email</label>
                            <input
                                type="email"
                                name="personal_email"
                                value={formData.personal_email}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="your.email@example.com"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone Number <span className="required">*</span></label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                                placeholder="09xxxxxxxx"
                            />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Your address"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Region</label>
                            <input
                                type="text"
                                name="region"
                                value={formData.region}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="e.g., Oromia"
                            />
                        </div>
                        <div className="form-group">
                            <label>Zone</label>
                            <input
                                type="text"
                                name="zone"
                                value={formData.zone}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="e.g., West Shewa"
                            />
                        </div>
                        <div className="form-group">
                            <label>Woreda</label>
                            <input
                                type="text"
                                name="woreda"
                                value={formData.woreda}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="e.g., Ambo"
                            />
                        </div>
                    </div>
                </div>

                {/* Academic Information */}
                <div className="form-section">
                    <h3>Academic Information</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Campus</label>
                            <input
                                type="text"
                                name="campus"
                                value={formData.campus}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="e.g., Main Campus"
                            />
                        </div>
                        <div className="form-group">
                            <label>School</label>
                            <input
                                type="text"
                                name="school"
                                value={formData.school}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="e.g., School of Engineering"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Department <span className="required">*</span></label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                            >
                                <option value="">Select Department</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Software Engineering">Software Engineering</option>
                                <option value="Information Systems">Information Systems</option>
                                <option value="Electrical Engineering">Electrical Engineering</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Civil Engineering">Civil Engineering</option>
                                <option value="Business Administration">Business Administration</option>
                                <option value="Accounting">Accounting</option>
                                <option value="Economics">Economics</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Program</label>
                            <select
                                name="program"
                                value={formData.program}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="">Select Program</option>
                                <option value="Regular">Regular</option>
                                <option value="Extension">Extension</option>
                                <option value="Distance">Distance</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Year <span className="required">*</span></label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                            >
                                <option value="">Select Year</option>
                                <option value="1">Year 1</option>
                                <option value="2">Year 2</option>
                                <option value="3">Year 3</option>
                                <option value="4">Year 4</option>
                                <option value="5">Year 5</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Semester</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="">Select Semester</option>
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Section</label>
                            <input
                                type="text"
                                name="section"
                                value={formData.section}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="e.g., A"
                            />
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="form-section">
                    <h3>Emergency Contact</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Name</label>
                            <input
                                type="text"
                                name="emergency_contact_name"
                                value={formData.emergency_contact_name}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Emergency contact name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Relationship</label>
                            <select
                                name="emergency_contact_relationship"
                                value={formData.emergency_contact_relationship}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="">Select Relationship</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Brother">Brother</option>
                                <option value="Sister">Sister</option>
                                <option value="Uncle">Uncle</option>
                                <option value="Aunt">Aunt</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Phone</label>
                            <input
                                type="tel"
                                name="emergency_contact_phone"
                                value={formData.emergency_contact_phone}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="09xxxxxxxx"
                            />
                        </div>
                        <div className="form-group">
                            <label>Contact Address</label>
                            <input
                                type="text"
                                name="emergency_contact_address"
                                value={formData.emergency_contact_address}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Emergency contact address"
                            />
                        </div>
                    </div>
                </div>

                {/* ID Document Upload */}
                <div className="form-section">
                    <h3>ID Document</h3>
                    <div className="form-group">
                        <label htmlFor="id-doc-input" className="btn btn-secondary">
                            <i className="fas fa-id-card"></i> Upload ID Document
                        </label>
                        <input
                            type="file"
                            id="id-doc-input"
                            accept="image/*"
                            onChange={handleIdDocChange}
                            style={{ display: 'none' }}
                        />
                        <p className="file-info">
                            {idDocFile ? idDocFile.name : 'No ID document selected'}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-cancel"
                        onClick={() => window.history.back()}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;


