import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  ButtonGroup
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import EmployeeIDCardBack from './EmployeeIDCardBack';

function EmployeeIDCard({ employee, open, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = React.useState(false);
  const [showBack, setShowBack] = useState(false);

  if (!employee) return null;

  // Format employee info
  const employeeId = employee.employee_id || 'N/A';
  const fullName = `${employee.first_name} ${employee.last_name}`.toUpperCase();
  const position = employee.position || 'N/A';
  const department = employee.department_id || 'N/A';
  const email = employee.email || 'N/A';
  const phone = employee.phone || 'N/A';
  const campus = employee.campus || 'Main Campus';
  const cardNumber = employee.card_number || 'CARD-EMP-2026-000001';
  const qrCode = employee.qr_code || '';

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const element = cardRef.current;
      
      // Capture the card as image
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Credit card size
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      pdf.save(`${employeeId}_ID_Card.pdf`);

      alert('ID Card downloaded successfully!');
      setDownloading(false);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download card');
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const element = cardRef.current;
    const html = element.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee ID Card - ${employeeId}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body onload="window.print()">
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Employee ID Card - {showBack ? 'Back' : 'Front'}
          <Button onClick={onClose} size="small">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        {/* Toggle Button */}
        <ButtonGroup sx={{ mb: 2 }}>
          <Button
            variant={!showBack ? 'contained' : 'outlined'}
            onClick={() => setShowBack(false)}
          >
            Front
          </Button>
          <Button
            variant={showBack ? 'contained' : 'outlined'}
            onClick={() => setShowBack(true)}
          >
            Back
          </Button>
        </ButtonGroup>

        {/* Card Display */}
        <Box ref={cardRef}>
          {!showBack ? (
            // FRONT SIDE
            <Box
              sx={{
                width: '400px',
                height: '250px',
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                borderRadius: '15px',
                padding: '15px',
                color: 'white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'Arial, sans-serif',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* HEADER with Logo */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 1, borderBottom: '2px solid rgba(255,255,255,0.3)' }}>
                {/* Logo */}
                <Box
                  component="img"
                  src="/images/ambo-university-logo.png"
                  alt="Ambo University"
                  sx={{
                    height: '35px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
                {/* Title */}
                <Box sx={{ textAlign: 'center', flex: 1, mx: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0, fontSize: '12px' }}>
                    AMBO UNIVERSITY
                  </Typography>
                  <Typography sx={{ fontSize: '9px', fontStyle: 'italic' }}>
                    EMPLOYEE ID CARD
                  </Typography>
                </Box>
                {/* Logo placeholder on right */}
                <Box
                  sx={{
                    width: '35px',
                    height: '35px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  A
                </Box>
              </Box>

              {/* MAIN CONTENT - Employee Info with Photo */}
              <Box sx={{ flex: 1, display: 'flex', gap: 1, mb: 1 }}>
                {/* Left Column - QR Code */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                  {/* QR Code */}
                  {qrCode ? (
                    <Box
                      component="img"
                      src={qrCode}
                      sx={{ width: '70px', height: '70px', backgroundColor: 'white', p: '2px', borderRadius: '4px' }}
                    />
                  ) : (
                    <Box sx={{ width: '70px', height: '70px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                  )}
                  
                  <Typography sx={{ fontSize: '7px', textAlign: 'center', mt: 0.5 }}>
                    Scan for<br />Verification
                  </Typography>
                </Box>

                {/* Middle Column - Employee Details */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {/* Employee Info */}
                  <Box>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '12px', mb: 0.3 }}>
                      {fullName}
                    </Typography>
                    <Typography sx={{ fontSize: '9px', mb: 0.2 }}>
                      <strong>ID:</strong> {employeeId}
                    </Typography>
                    <Typography sx={{ fontSize: '9px', mb: 0.2 }}>
                      <strong>Pos:</strong> {position}
                    </Typography>
                    <Typography sx={{ fontSize: '9px', mb: 0.2 }}>
                      <strong>Dept:</strong> {department}
                    </Typography>
                  </Box>

                  {/* Contact Info at Bottom */}
                  <Box>
                    <Typography sx={{ fontSize: '8px', mb: 0.1 }}>
                      <strong>E:</strong> {email.substring(0, 18)}
                    </Typography>
                    <Typography sx={{ fontSize: '8px' }}>
                      <strong>Ph:</strong> {phone.substring(0, 13)}
                    </Typography>
                  </Box>
                </Box>

                {/* Right Column - Employee Photo */}
                <Box sx={{
                  width: '75px',
                  height: '90px',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '3px solid white',
                  borderRadius: '4px',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  {employee?.photo ? (
                    <Box
                      component="img"
                      src={employee.photo}
                      alt="Employee Photo"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <Box sx={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                      color: '#999'
                    }}>
                      📷
                    </Box>
                  )}
                </Box>
              </Box>

              {/* FOOTER */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', borderTop: '1px solid rgba(255,255,255,0.3)', pt: 0.5 }}>
                <Typography sx={{ fontSize: '8px' }}>
                  Campus: {campus}
                </Typography>
                <Typography sx={{ fontSize: '8px', fontStyle: 'italic' }}>
                  {new Date().getFullYear()}
                </Typography>
              </Box>
            </Box>
          ) : (
            // BACK SIDE
            <EmployeeIDCardBack employee={employee} />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          color="secondary"
        >
          Print
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="contained"
          startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EmployeeIDCard;
