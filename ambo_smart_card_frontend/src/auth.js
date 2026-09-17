// Authentication helper for Ambo University Smart Card System
import { API_URL } from './config';

/**
 * Get the current JWT token from localStorage
 */
export const getToken = () => localStorage.getItem('token');

/**
 * Get the current user role from localStorage
 */
export const getUserRole = () => localStorage.getItem('role');

/**
 * Get the current username from localStorage
 */
export const getUsername = () => localStorage.getItem('username');

/**
 * Get the current student_id from localStorage
 */
export const getStudentId = () => localStorage.getItem('student_id');

/**
 * Store user session data in localStorage
 */
export const setSession = (token, role, username, studentId = null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('username', username);
    if (studentId) {
        localStorage.setItem('student_id', studentId);
    }
};

/**
 * Clear user session from localStorage
 */
export const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('student_id');
};

/**
 * Create Authorization header with Bearer token
 */
export const getAuthHeaders = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Handle 401 (Unauthorized) errors - clear session and redirect to login
 * @param {string} errorMsg - The error message from the server
 * @param {boolean} silent - If true, don't show alert (just clear session)
 * @returns {boolean} - Returns true if session was cleared
 */
export const handleUnauthorized = (errorMsg = null, silent = false) => {
    // Check if it's a token expiration or invalid token error
    if (errorMsg?.includes('Invalid token') || 
        errorMsg?.includes('jwt expired') || 
        errorMsg?.includes('No token provided')) {
        clearSession();
        if (!silent) {
            alert('Your session expired. Please log in again.');
        }
        window.location.href = '/login';
        return true;
    }
    return false;
};

/**
 * Wrapper around fetch that automatically includes auth token and handles 401
 */
export const apiFetch = async (url, options = {}) => {
    // Ensure we always have the latest token
    const headers = {
        ...options.headers,
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Check for 401 Unauthorized
        if (response.status === 401) {
            const data = await response.json();
            handleUnauthorized(data?.error);
            return null;
        }

        return response;
    } catch (error) {
        // Network errors or other exceptions
        handleUnauthorized(error.message, true);
        throw error;
    }
};

/**
 * Safe JSON fetch with 401 handling (like CafeteriaAttendanceDashboard safeFetch but with auth)
 */
export const safeFetch = async (url, options = {}) => {
    try {
        const response = await apiFetch(url, options);
        if (!response) return { success: false, error: 'Unauthorized - session cleared' };

        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            const preview = text.substring(0, 200);
            throw new Error(
                `Server returned ${contentType || 'unknown type'} instead of JSON. ` +
                `Status: ${response.status}. Response: "${preview}..."`
            );
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || `HTTP ${response.status}`);
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Logout user - clear session and redirect to login
 */
export const logout = () => {
    clearSession();
    window.location.href = '/login';
};
