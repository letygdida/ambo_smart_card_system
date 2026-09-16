import { API_URL } from '../config';

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
  Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

function EmployeeSmartIDUnified({ employee, open, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [barcodeLoading, setBarcodeLoading] = useState(true);
  const [error, setError] = useState('');

  // Unified Premium Color Palette
  const colors = {
    deepBlack: '#0B0D10',
    matteCharcoal: '#17191C',
    darkCharcoal: '#252A30',
    premiumGold: '#C9A227',
    champagneGold: '#E0C66B',
    pureWhite: '#FFFFFF',
    softGray: '#F2F3F4',
    lightSilver: '#D9DCE0'
  };

  // Format employee ID
  const formatEmployeeId = (id) => {
    if (!id) return 'N/A';
    return id;
  };

  // Extract employee data
  const employeeId = employee ? formatEmployeeId(employee.employee_id) : 'N/A';
  const firstName = employee?.first_name || '';
  const middleName = employee?.middle_name || '';
  const lastName = employee?.last_name || '';
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const position = employee?.position || 'N/A';
  const department = employee?.department_name || 'N/A';
  const email = employee?.email || 'N/A';
  const phone = employee?.phone || 'N/A';
  const photo = employee?.photo ? `${API_URL}${employee.photo}` : null;
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Generate QR Code
  useEffect(() => {
    if (!employee || !open) return;

    const generateQR = async () => {
      try {
        setQrLoading(true);
        const dataUrl = await QRCode.toDataURL(employeeId, {
          width: 100,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQrDataUrl(dataUrl);
        setQrLoading(false);
      } catch (e) {
        setError('QR Code failed: ' + e.message);
        setQrLoading(false);
      }
    };

    generateQR();
  }, [employee, employeeId, open]);

  // Generate Barcode
  useEffect(() => {
    if (!employee || !open) return;

    const generateBarcode = async () => {
      try {
        setBarcodeLoading(true);
        
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'temp-barcode-' + Date.now();
        container.appendChild(svg);
        
        JsBarcode('#' + svg.id, employeeId, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false,
          margin: 5,
          lineColor: '#000000'
        });
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png');
          setBarcodeDataUrl(dataUrl);
          setBarcodeLoading(false);
          
          document.body.removeChild(container);
        };
        
        img.onerror = () => {
          setError('Barcode generation failed');
          setBarcodeLoading(false);
          document.body.removeChild(container);
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      } catch (e) {
        setError('Barcode error: ' + e.message);
        setBarcodeLoading(false);
      }
    };

    generateBarcode();
  }, [employee, employeeId, open]);

  if (!employee) return null;

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const element = cardRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [171.2, 53.98]
      });

      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${employeeId}_Employee_ID.pdf`);

      setDownloading(false);
      alert('Employee ID Card downloaded successfully!');
    } catch (err) {
      setError('Failed to download PDF');
      setDownloading(false);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      setDownloading(true);
      const element = cardRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${employeeId}_Employee_ID.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloading(false);
      alert('Employee ID Card downloaded as PNG successfully!');
    } catch (err) {
      setError('Failed to download PNG');
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '', 'width=1200,height=800');
      const element = cardRef.current;
      const html = element.innerHTML;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Employee ID - ${employeeId}</title>
            <style>
              * { margin: 0; padding: 0; }
              body { font-family: 'Segoe UI', Arial, sans-serif; }
              @media print { 
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${html}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      setError('Failed to print');
    }
  };

  // Premium Header Component
  const PremiumHeader = ({ logo = true }) => (
    <Box sx={{ 
      background: `linear-gradient(135deg, #2A0D16 0%, #481522 30%, #641F2E 60%, #35101C 100%)`,
      p: '14px 16px 11px',
      textAlign: 'center',
      borderBottom: `1.5px solid ${colors.premiumGold}`,
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%)',
        pointerEvents: 'none'
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)',
        pointerEvents: 'none'
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.25, position: 'relative', zIndex: 1 }}>
        {logo && <Box component="img" src="/images/ambo-university-logo.png" alt="Ambo Logo" sx={{ height: '20px', filter: 'brightness(1.15)' }} />}
        <Box>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: colors.pureWhite, letterSpacing: '0.8px' }}>
            AMBO UNIVERSITY
          </Typography>
          <Typography sx={{ fontSize: '0.55rem', fontWeight: '600', color: colors.champagneGold, letterSpacing: '0.4px' }}>
            EMPLOYEE IDENTIFICATION CARD
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Employee ID Card - {employeeId}</Typography>
          <Button onClick={onClose} size="small" color="inherit">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, background: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}

        <Box
          ref={cardRef}
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 3,
            width: '100%',
            maxWidth: '1000px'
          }}
        >
          {/* ==================== BACK SIDE - QR & POLICY ==================== */}
          <Box sx={{
            background: `linear-gradient(135deg, ${colors.matteCharcoal} 0%, ${colors.darkCharcoal} 50%, ${colors.matteCharcoal} 100%)`,
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(11, 13, 16, 0.3)',
            border: `1px solid ${colors.darkCharcoal}`,
            display: 'flex',
            flexDirection: 'column',
            aspectRatio: '8.7/5.5',
            color: colors.pureWhite,
            fontFamily: "'Segoe UI', -apple-system, sans-serif",
            justifyContent: 'space-between'
          }}>
            {/* Unified Premium Header */}
            <PremiumHeader />

            {/* Body Content */}
            <Box sx={{ p: 2, display: 'flex', gap: 1.2, flex: 1, my: 0.6 }}>
              {/* QR Code */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: colors.pureWhite,
                borderRadius: '6px',
                p: 0.8,
                minWidth: '115px',
                border: `1.5px solid ${colors.premiumGold}`,
                boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
              }}>
                {qrLoading ? (
                  <CircularProgress size={35} sx={{ color: colors.premiumGold }} />
                ) : qrDataUrl ? (
                  <Box 
                    component="img" 
                    src={qrDataUrl} 
                    alt="QR Code"
                    sx={{ width: '100px', height: '100px', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '0.5rem', color: '#ff6b6b' }}>QR Failed</Typography>
                )}
                <Typography sx={{ fontSize: '0.4rem', mt: 0.4, color: colors.darkCharcoal, fontWeight: '600', letterSpacing: '0.3px' }}>
                  SCAN TO VERIFY
                </Typography>
              </Box>

              {/* Policy Section */}
              <Box sx={{ flex: 1, background: `linear-gradient(135deg, ${colors.softGray} 0%, ${colors.pureWhite} 100%)`, p: '8px', borderRadius: '4px', border: `1px solid ${colors.premiumGold}`, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: colors.premiumGold, mb: 0.35 }}>
                  ID CARD USE POLICY
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.12 }}>
                  {[
                    'Official use for identification only',
                    'Keep card secure and do not lend',
                    'Report lost cards immediately',
                    'Return card when employment ends',
                    'Unauthorized use prohibited'
                  ].map((policy, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 0.25, alignItems: 'flex-start' }}>
                      <Box sx={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: colors.premiumGold,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.4rem',
                        fontWeight: 'bold',
                        color: colors.darkCharcoal,
                        mt: 0.15
                      }}>
                        {idx + 1}
                      </Box>
                      <Typography sx={{ fontSize: '0.42rem', lineHeight: 1.1, color: colors.darkCharcoal }}>
                        {policy}
                      </Typography>
                    </Box>
                  ))}
                  {/* Authorized Signature */}
                  <Box sx={{ mt: 0.5, pt: 0.35, borderTop: `0.5px solid ${colors.premiumGold}` }}>
                    <Typography sx={{ fontSize: '0.4rem', color: colors.darkCharcoal, fontWeight: 'bold', textAlign: 'center', letterSpacing: '0.2px' }}>
                      _________________
                    </Typography>
                    <Typography sx={{ fontSize: '0.39rem', color: colors.darkCharcoal, textAlign: 'center', mt: 0.08 }}>
                      Authorized Signature
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Back Footer */}
            <Box sx={{ px: 2, pb: 1, fontSize: '0.4rem', borderTop: `1px solid ${colors.premiumGold}`, pt: 0.6, display: 'flex', flexDirection: 'column', gap: 0.2, color: colors.champagneGold }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Issued: {currentDate}</span>
                <span>© {currentYear} Ambo University</span>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-around',
                fontSize: '0.39rem',
                borderTop: `0.5px solid ${colors.premiumGold}`,
                pt: 0.25
              }}>
                <span>P.O.Box: 19</span>
                <span>Tel: 251-112-362215</span>
                <span>Fax: 251-112-362037</span>
                <span>www.ambo.edu.et</span>
              </Box>
            </Box>
          </Box>

          {/* ==================== FRONT SIDE - EMPLOYEE INFO ==================== */}
          <Box sx={{
            background: `linear-gradient(135deg, ${colors.matteCharcoal} 0%, ${colors.darkCharcoal} 50%, ${colors.matteCharcoal} 100%)`,
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(11, 13, 16, 0.3)',
            border: `1px solid ${colors.darkCharcoal}`,
            display: 'flex',
            flexDirection: 'column',
            aspectRatio: '8.7/5.5',
            color: colors.pureWhite,
            fontFamily: "'Segoe UI', -apple-system, sans-serif",
            justifyContent: 'space-between'
          }}>
            {/* Unified Premium Header */}
            <PremiumHeader />

            {/* Body Content */}
            <Box sx={{ p: 2, display: 'flex', gap: 1.2, mb: 1, flex: 1 }}>
              {/* Photo */}
              <Box sx={{
                width: '65px',
                height: '85px',
                background: colors.pureWhite,
                border: `1.5px solid ${colors.premiumGold}`,
                borderRadius: '5px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                {photo ? (
                  <Box component="img" src={photo} alt="Employee" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    <svg viewBox="0 0 24 24" fill="#ccc" sx={{ width: '35px', height: '35px' }}>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M12 14c-5 0-7 2-7 2v6h14v-6s-2-2-7-2z" />
                    </svg>
                  </Box>
                )}
              </Box>

              {/* Employee Info */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Name Section */}
                <Box sx={{ mt: 0.5 }}>
                  <Typography sx={{ 
                    fontSize: '0.6rem', 
                    fontWeight: 'bold', 
                    color: colors.champagneGold, 
                    lineHeight: 1.2,
                    borderBottom: `1px solid ${colors.champagneGold}`,
                    pb: 0.2,
                    display: 'inline-block'
                  }}>
                    NAME: {fullName}
                  </Typography>
                </Box>

                {/* Details Box */}
                <Box sx={{
                  background: `linear-gradient(135deg, ${colors.softGray} 0%, ${colors.pureWhite} 100%)`,
                  p: '6px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${colors.premiumGold}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  <Typography sx={{ fontSize: '0.46rem', color: colors.darkCharcoal, lineHeight: 1.2 }}>
                    EMPLOYEE ID: {employeeId}
                  </Typography>
                  <Typography sx={{ fontSize: '0.46rem', color: colors.darkCharcoal, lineHeight: 1.2 }}>
                    EMPLOYEE TYPE: {employee?.employee_type || 'N/A'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.46rem', color: colors.darkCharcoal, lineHeight: 1.2 }}>
                    POSITION: {position}
                  </Typography>
                  <Typography sx={{ fontSize: '0.46rem', color: colors.darkCharcoal, lineHeight: 1.2 }}>
                    DEPARTMENT: {department}
                  </Typography>
                  <Typography sx={{ fontSize: '0.46rem', color: colors.darkCharcoal, lineHeight: 1.2 }}>
                    CAMPUS: {employee?.campus || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Barcode Section */}
            <Box sx={{
              background: colors.pureWhite,
              p: '6px',
              borderRadius: '4px',
              border: `1.5px solid ${colors.premiumGold}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 0.8,
              minHeight: '48px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}>
              {barcodeLoading ? (
                <CircularProgress size={20} sx={{ color: colors.premiumGold }} />
              ) : barcodeDataUrl ? (
                <Box 
                  component="img" 
                  src={barcodeDataUrl} 
                  alt="Barcode"
                  sx={{ maxWidth: '100%', height: 'auto', maxHeight: '42px' }}
                />
              ) : (
                <Typography sx={{ fontSize: '0.5rem', color: '#ff6b6b' }}>Barcode Failed</Typography>
              )}
            </Box>

            {/* Front Footer - Status */}
            <Box sx={{ px: 2, pb: 1, borderTop: `1px solid ${colors.premiumGold}`, pt: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
                <Box sx={{ width: '6px', height: '6px', background: colors.premiumGold, borderRadius: '50%' }} />
                <Typography sx={{ fontSize: '0.52rem', fontWeight: 'bold', color: colors.champagneGold }}>
                  ACTIVE
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: colors.premiumGold }}>
                {currentYear}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          color="info"
        >
          PRINT
        </Button>
        <Button
          onClick={handleDownloadPNG}
          variant="contained"
          startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
          disabled={downloading}
          sx={{ bgcolor: '#FF9800' }}
        >
          {downloading ? 'Downloading...' : 'DOWNLOAD PNG'}
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="contained"
          startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : 'DOWNLOAD PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EmployeeSmartIDUnified;
