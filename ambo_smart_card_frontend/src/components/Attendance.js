import { API_URL } from '../config';

import { useState, useEffect } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';

import {
    TextField,
    Button,
    Typography,
    Card,
    CardContent,
    Box,
    Avatar,
    Switch,
    FormControlLabel
} from "@mui/material";



function Attendance(){


    const [cardId,setCardId] = useState("");
    const [studentId, setStudentId] = useState("");

    const [student,setStudent] = useState(null);

    const [message,setMessage] = useState("");
    
    const [showScanner, setShowScanner] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState(null);



    const token = localStorage.getItem("token");

    // Check if user has attendance today when component loads
    useEffect(() => {
        const checkTodayAttendance = () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            
            try {
                const user = JSON.parse(userStr);
                if (user.student_id) {
                    checkDebugInfoSilent(user.student_id);
                }
            } catch (e) {
                console.log("Could not parse user data");
            }
        };
        
        checkTodayAttendance();
    }, []);

    const handleScan = (result) => {
        if (result && result[0]?.rawValue) {
            try {
                // Try to parse as JSON (from QR code)
                const data = JSON.parse(result[0].rawValue);
                if (data.studentId) {
                    setStudentId(data.studentId);
                    setMessage(`Student ID scanned: ${data.studentId}`);
                    // Automatically mark attendance
                    markAttendance(data.studentId);
                }
            } catch (e) {
                // If not JSON, treat as plain student ID (from barcode)
                const scannedValue = result[0].rawValue;
                setStudentId(scannedValue);
                setMessage(`Student ID scanned: ${scannedValue}`);
                markAttendance(scannedValue);
            }
            setShowScanner(false);
        }
    };

    const markAttendance = (id) => {
        const studentIdToUse = id || studentId || cardId;
        
        if(!studentIdToUse){
            setMessage("Please enter or scan Student ID");
            return;
        }

        // Show loading message
        setMessage("Checking attendance...");
        setStudent(null);

        fetch(
            `${API_URL}/api/attendance/mark`,
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    Authorization:"Bearer " + token
                },
                body:JSON.stringify({
                    student_id: studentIdToUse
                })
            }
        )
        .then(res=>res.json())
        .then(data=>{
            // Handle different response scenarios
            if (data.message) {
                setMessage(data.message);
                
                // If attendance already marked, show debug info
                if (data.message.includes("already marked")) {
                    setMessage(`${data.message} - If this is incorrect, please contact admin or try debug mode.`);
                }
            } else {
                setMessage("Attendance marked successfully");
            }

            if(data.student){
                setStudent(data.student);
                // If successful, check for today's attendance to update status
                if (data.message === "Attendance marked successfully") {
                    setTimeout(() => {
                        checkDebugInfoSilent(studentIdToUse);
                    }, 500);
                }
            } else {
                setStudent(null);
            }
        })
        .catch(err=>{
            console.error("Attendance marking error:", err);
            setMessage("Server connection error");
            setStudent(null);
        });
    };


    const checkDebugInfoSilent = (studentIdToCheck) => {
        fetch(
            `${API_URL}/api/attendance/debug/student/${studentIdToCheck}`,
            {
                headers:{
                    Authorization:"Bearer " + token
                }
            }
        )
        .then(res=>res.json())
        .then(data=>{
            if (data.debug_info && data.debug_info.attendance_records_today > 0) {
                setTodayAttendance(data.debug_info.attendance_records[0]);
            }
        })
        .catch(err=>{
            // Silent fail for background check
            console.log("Background attendance check failed");
        });
    };

    const checkDebugInfo = () => {
        const studentIdToUse = studentId || cardId;
        
        if(!studentIdToUse){
            setMessage("Please enter Student ID for debug check");
            return;
        }

        fetch(
            `${API_URL}/api/attendance/debug/student/${studentIdToUse}`,
            {
                headers:{
                    Authorization:"Bearer " + token
                }
            }
        )
        .then(res=>res.json())
        .then(data=>{
            setDebugInfo(data.debug_info);
            setMessage(`Debug info retrieved for ${studentIdToUse}`);
        })
        .catch(err=>{
            console.error("Debug check error:", err);
            setMessage("Failed to get debug info");
        });
    };

    const clearTodayAttendance = () => {
        const studentIdToUse = studentId || cardId;
        
        if(!studentIdToUse){
            setMessage("Please enter Student ID to clear attendance");
            return;
        }

        if(!window.confirm(`Are you sure you want to clear today's attendance for ${studentIdToUse}?`)) {
            return;
        }

        fetch(
            `${API_URL}/api/attendance/debug/student/${studentIdToUse}/clear-today`,
            {
                method: "DELETE",
                headers:{
                    Authorization:"Bearer " + token
                }
            }
        )
        .then(res=>res.json())
        .then(data=>{
            setMessage(data.message);
            setDebugInfo(null);
            setStudent(null);
            setTodayAttendance(null); // Clear the status display
        })
        .catch(err=>{
            console.error("Clear attendance error:", err);
            setMessage("Failed to clear attendance");
        });
    };

    const scanCard=()=>{
        markAttendance();
    };



return(


<div style={{padding:"30px"}}>



<Typography variant="h4" sx={{mb: 3}}>

📸 Attendance Scanner

</Typography>

{todayAttendance && (
    <Card sx={{mb: 3, backgroundColor: "#e8f5e8", border: "2px solid #4caf50"}}>
        <CardContent>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                <Avatar sx={{backgroundColor: "#4caf50", color: "white"}}>✓</Avatar>
                <Box>
                    <Typography variant="h6" color="success.main">
                        Attendance Already Marked Today
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Checked in at: {todayAttendance.check_in_time} | 
                        Status: {todayAttendance.attendance_status} |
                        Record ID: {todayAttendance.attendance_id}
                    </Typography>
                </Box>
            </Box>
        </CardContent>
    </Card>
)}

<Box sx={{mb: 3}}>
    <FormControlLabel
        control={
            <Switch
                checked={showScanner}
                onChange={(e) => setShowScanner(e.target.checked)}
                color="primary"
            />
        }
        label="Enable QR/Barcode Scanner"
    />
    <br />
    <FormControlLabel
        control={
            <Switch
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                color="secondary"
            />
        }
        label="Debug Mode (Admin)"
    />
</Box>

{showScanner && (
    <Box sx={{mb: 3, maxWidth: 400, border: '2px solid #1976d2', borderRadius: 2, overflow: 'hidden'}}>
        <Scanner
            onScan={handleScan}
            onError={(error) => console.log(error?.message)}
            constraints={{ facingMode: 'environment' }}
            styles={{
                container: { width: '100%' }
            }}
        />
        <Typography variant="caption" sx={{display: 'block', textAlign: 'center', p: 1, backgroundColor: '#f5f5f5'}}>
            Point camera at QR code or barcode
        </Typography>
    </Box>
)}


<TextField

label="Enter Student ID (e.g., 2026-4795)"

value={studentId}

onChange={(e)=>setStudentId(e.target.value)}
onKeyPress={(e) => {
    if (e.key === 'Enter') {
        scanCard();
    }
}}

sx={{marginTop:"20px", minWidth: 300}}

/>







<br/>







<Button

variant="contained"

sx={{marginTop:"20px"}}

onClick={scanCard}

>

✓ Mark Attendance

</Button>

{showDebug && (
    <>
        <Button
            variant="outlined"
            color="info"
            sx={{marginTop:"10px", marginLeft: "10px"}}
            onClick={checkDebugInfo}
        >
            🔍 Debug Check
        </Button>
        
        <Button
            variant="outlined"
            color="warning"
            sx={{marginTop:"10px", marginLeft: "10px"}}
            onClick={clearTodayAttendance}
        >
            🗑️ Clear Today
        </Button>
    </>
)}








<Typography

sx={{marginTop:"20px", fontWeight: message.includes('error') ? 'bold' : 'normal', color: message.includes('error') ? 'error.main' : 'success.main'}}

>

{message}

</Typography>

{debugInfo && (
    <Card sx={{marginTop:"20px", maxWidth:"600px", backgroundColor: "#f5f5f5"}}>
        <CardContent>
            <Typography variant="h6" color="primary" sx={{mb: 2}}>
                🔍 Debug Information
            </Typography>
            <Typography variant="body2" sx={{mb: 1}}>
                <strong>Student ID:</strong> {debugInfo.student_id}
            </Typography>
            <Typography variant="body2" sx={{mb: 1}}>
                <strong>Check Date:</strong> {debugInfo.check_date}
            </Typography>
            <Typography variant="body2" sx={{mb: 1}}>
                <strong>Student Exists:</strong> {debugInfo.student_exists ? '✅ Yes' : '❌ No'}
            </Typography>
            <Typography variant="body2" sx={{mb: 1}}>
                <strong>Attendance Records Today:</strong> {debugInfo.attendance_records_today}
            </Typography>
            {debugInfo.student_data && (
                <Typography variant="body2" sx={{mb: 1}}>
                    <strong>Student Name:</strong> {debugInfo.student_data.full_name || debugInfo.student_data.name}
                </Typography>
            )}
            {debugInfo.attendance_records && debugInfo.attendance_records.length > 0 && (
                <Box sx={{mt: 2}}>
                    <Typography variant="body2" sx={{fontWeight: 'bold', mb: 1}}>
                        Existing Records:
                    </Typography>
                    {debugInfo.attendance_records.map((record, index) => (
                        <Typography key={index} variant="caption" sx={{display: 'block', ml: 2}}>
                            ID: {record.attendance_id}, Status: {record.attendance_status}, 
                            Check-in: {record.check_in_time}
                        </Typography>
                    ))}
                </Box>
            )}
        </CardContent>
    </Card>
)}









{

student &&


<Card

sx={{

marginTop:"30px",

maxWidth:"450px",
boxShadow: 3

}}

>


<CardContent>

<Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
    {student.photo && (
        <Avatar
            src={`${API_URL}/uploads/registrations/${student.photo}`}
            sx={{width: 80, height: 80}}
        />
    )}
    <Box>
        <Typography variant="h5" color="success.main">
            ✓ Attendance Recorded
        </Typography>
        <Typography variant="caption" color="text.secondary">
            {new Date().toLocaleString()}
        </Typography>
    </Box>
</Box>


<Typography variant="body1" sx={{mb: 1}}>
    <strong>Student:</strong> {student.full_name || student.name}
</Typography>

<Typography variant="body2" sx={{mb: 1}}>
    <strong>Student ID:</strong> {student.student_id}
</Typography>

<Typography variant="body2" sx={{mb: 1}}>
    <strong>Department:</strong> {student.department}
</Typography>

<Typography variant="body2">
    <strong>Year:</strong> {student.year}
</Typography>




</CardContent>


</Card>



}






</div>


);


}



export default Attendance;