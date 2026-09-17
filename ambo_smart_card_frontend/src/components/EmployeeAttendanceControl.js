import { API_URL } from '../config';
import { getToken } from '../auth';

import React, { useState, useEffect } from 'react';
import './EmployeeAttendanceControl.css';

const EmployeeAttendanceControl = () => {
    const [controlData, setControlData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [todaySummary, setTodaySummary] = useState([]);
    const [serverTime, setServerTime] = useState({
        time: '',
        date: '',
        day: ''
    });

    // Configuration modal state
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configForm, setConfigForm] = useState({
        attendance_type: 'check-in',
        control_mode: 'manual',
        auto_start_time: '08:00',
        auto_end_time: '15:10',
        active_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
        description: ''
    });

    // Action logs state
    const [showLogs, setShowLogs] = useState(false);
    const [actionLogs, setActionLogs] = useState([]);

    useEffect(() => {
        loadControlStatus();
        loadTodaySummary();
        
        // Refresh status every 30 seconds
        const interval = setInterval(() => {
            loadControlStatus();
            loadTodaySummary();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadControlStatus = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/employee-attendance-control/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load control status');
            }

            const data = await response.json();
            setControlData(data.controls || []);
            setServerTime({
                time: new Date(data.server_time).toLocaleTimeString(),
                date: data.server_date,
                day: data.server_day
            });
            setLoading(false);
            setError('');
        } catch (err) {
            console.error('Error loading control status:', err);
            setError('Failed to load attendance control status');
            setLoading(false);
        }
    };

    const loadTodaySummary = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/employee-attendance-control/today-summary`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTodaySummary(data.summary || []);
            }
        } catch (err) {
            console.error('Error loading summary:', err);
        }
    };

    const handleManualOpen = async (attendanceType) => {
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/employee-attendance-control/manual/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ attendance_type: attendanceType })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to open attendance');
            }

            setSuccess(`${attendanceType} attendance opened successfully`);
            loadControlStatus();
        } catch (err) {
            console.error('Error opening attendance:', err);
            setError(err.message || 'Failed to open attendance');
        }
    };

    const handleManualClose = async (attendanceType) => {
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/employee-attendance-control/manual/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ attendance_type: attendanceType })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to close attendance');
            }

            setSuccess(`${attendanceType} attendance closed successfully`);
            loadControlStatus();
        } catch (err) {
            console.error('Error closing attendance:', err);
            setError(err.message || 'Failed to close attendance');
        }
    };

    const openConfigModal = (control) => {
        setConfigForm({
            attendance_type: control.attendance_type,
            control_mode: control.control_mode,
            auto_start_time: control.auto_start_time || '08:00',
            auto_end_time: control.auto_end_time || '15:10',
            active_days: control.active_days || 'Monday,Tuesday,Wednesday,Thursday,Friday',
            description: control.description || ''
        });
        setShowConfigModal(true);
    };

    const handleConfigSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/employee-attendance-control/configure`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(configForm)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update configuration');
            }

            setSuccess('Configuration updated successfully');
            setShowConfigModal(false);
            loadControlStatus();
        } catch (err) {
            console.error('Error updating configuration:', err);
            setError(err.message || 'Failed to update configuration');
        }
    };

    const loadActionLogs = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/api/employee-attendance-control/logs?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setActionLogs(data.logs || []);
                setShowLogs(true);
            }
        } catch (err) {
            console.error('Error loading logs:', err);
        }
    };

    const getStatusBadge = (currentStatus) => {
        if (currentStatus === 'open') {
            return <span className="status-badge status-open">?? OPEN</span>;
        } else {
            return <span className="status-badge status-closed">?? CLOSED</span>;
        }
    };

    const getAttendanceTypeLabel = (type) => {
        const labels = {
            'check-in': 'Check-In',
            'check-out': 'Check-Out',
            'break-start': 'Break Start',
            'break-end': 'Break End'
        };
        return labels[type] || type;
    };

    const getSummaryForType = (type) => {
        const summary = todaySummary.find(s => s.attendance_type === type);
        return summary || { total_scans: 0, unique_employees: 0 };
    };

    if (loading) {
        return (
            <div className="attendance-control-container">
                <div className="loading">Loading attendance control...</div>
            </div>
        );
    }

    return (
        <div className="attendance-control-container">
            <div className="control-header">
                <h2>Employee Attendance Time Control</h2>
                <div className="server-info">
                    <div className="info-item">
                        <i className="fas fa-calendar"></i>
                        <span>{serverTime.day}, {serverTime.date}</span>
                    </div>
                    <div className="info-item">
                        <i className="fas fa-clock"></i>
                        <span>{serverTime.time}</span>
                    </div>
                    <button className="btn-logs" onClick={loadActionLogs}>
                        <i className="fas fa-history"></i> View Logs
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <i className="fas fa-check-circle"></i> {success}
                </div>
            )}

            <div className="controls-grid">
                {controlData.map((control) => {
                    const summary = getSummaryForType(control.attendance_type);
                    
                    return (
                        <div key={control.id} className="control-card">
                            <div className="card-header">
                                <h3>{getAttendanceTypeLabel(control.attendance_type)}</h3>
                                {getStatusBadge(control.current_status)}
                            </div>

                            <div className="card-body">
                                <div className="control-info">
                                    <div className="info-row">
                                        <span className="label">Control Mode:</span>
                                        <span className="value mode-badge">
                                            {control.control_mode === 'manual' ? (
                                                <><i className="fas fa-hand-paper"></i> Manual</>
                                            ) : (
                                                <><i className="fas fa-clock"></i> Automatic</>
                                            )}
                                        </span>
                                    </div>

                                    {control.control_mode === 'automatic' && (
                                        <>
                                            <div className="info-row">
                                                <span className="label">Time Window:</span>
                                                <span className="value">
                                                    {control.auto_start_time} - {control.auto_end_time}
                                                </span>
                                            </div>
                                            <div className="info-row">
                                                <span className="label">Active Days:</span>
                                                <span className="value">{control.active_days}</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="info-row status-message">
                                        <i className="fas fa-info-circle"></i>
                                        <span>{control.status_message}</span>
                                    </div>
                                </div>

                                <div className="attendance-stats">
                                    <div className="stat-item">
                                        <div className="stat-value">{summary.unique_employees}</div>
                                        <div className="stat-label">Employees Today</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{summary.total_scans}</div>
                                        <div className="stat-label">Total Scans</div>
                                    </div>
                                </div>

                                {control.control_mode === 'manual' && (
                                    <div className="manual-controls">
                                        <button
                                            className="btn btn-open"
                                            onClick={() => handleManualOpen(control.attendance_type)}
                                            disabled={control.current_status === 'open'}
                                        >
                                            <i className="fas fa-unlock"></i> Open Attendance
                                        </button>
                                        <button
                                            className="btn btn-close"
                                            onClick={() => handleManualClose(control.attendance_type)}
                                            disabled={control.current_status === 'closed'}
                                        >
                                            <i className="fas fa-lock"></i> Close Attendance
                                        </button>
                                    </div>
                                )}

                                <button
                                    className="btn btn-configure"
                                    onClick={() => openConfigModal(control)}
                                >
                                    <i className="fas fa-cog"></i> Configure
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Configuration Modal */}
            {showConfigModal && (
                <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Configure {getAttendanceTypeLabel(configForm.attendance_type)}</h3>
                            <button className="btn-close-modal" onClick={() => setShowConfigModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleConfigSubmit}>
                            <div className="form-group">
                                <label>Control Mode</label>
                                <select
                                    value={configForm.control_mode}
                                    onChange={(e) => setConfigForm({...configForm, control_mode: e.target.value})}
                                    className="form-control"
                                >
                                    <option value="manual">Manual</option>
                                    <option value="automatic">Automatic</option>
                                </select>
                            </div>

                            {configForm.control_mode === 'automatic' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Start Time</label>
                                            <input
                                                type="time"
                                                value={configForm.auto_start_time}
                                                onChange={(e) => setConfigForm({...configForm, auto_start_time: e.target.value})}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Time</label>
                                            <input
                                                type="time"
                                                value={configForm.auto_end_time}
                                                onChange={(e) => setConfigForm({...configForm, auto_end_time: e.target.value})}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Active Days (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={configForm.active_days}
                                            onChange={(e) => setConfigForm({...configForm, active_days: e.target.value})}
                                            className="form-control"
                                            placeholder="Monday,Tuesday,Wednesday,Thursday,Friday"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Description (optional)</label>
                                <textarea
                                    value={configForm.description}
                                    onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Enter configuration notes..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-cancel" onClick={() => setShowConfigModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-save"></i> Save Configuration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Action Logs Modal */}
            {showLogs && (
                <div className="modal-overlay" onClick={() => setShowLogs(false)}>
                    <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Attendance Control Action Logs</h3>
                            <button className="btn-close-modal" onClick={() => setShowLogs(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="logs-container">
                            {actionLogs.length === 0 ? (
                                <p className="no-logs">No action logs found</p>
                            ) : (
                                <table className="logs-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Action</th>
                                            <th>Type</th>
                                            <th>Performed By</th>
                                            <th>Status Change</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actionLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.action_timestamp).toLocaleString()}</td>
                                                <td>
                                                    <span className={`action-badge action-${log.action_type}`}>
                                                        {log.action_type}
                                                    </span>
                                                </td>
                                                <td>{getAttendanceTypeLabel(log.attendance_type)}</td>
                                                <td>{log.performed_by}</td>
                                                <td>
                                                    {log.old_status && log.new_status && (
                                                        <span>{log.old_status} ? {log.new_status}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendanceControl;


