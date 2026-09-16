import React from 'react';
import {
  Box,
  Typography
} from '@mui/material';

function EmployeeIDCardBack({ employee }) {
  const currentDate = new Date();
  const issueDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Box
      sx={{
        width: '400px',
        height: '250px',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        borderRadius: '15px',
        padding: '15px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
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
            EMPLOYEE ID CARD - BACK
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

      {/* University Contact Info */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.3)', pb: 1, mb: 1 }}>
        <Typography sx={{ fontSize: '8px', mb: 0.2 }}>
          P.O. Box: 19
        </Typography>
        <Typography sx={{ fontSize: '8px', mb: 0.2 }}>
          Tel.No: 251-112-362215
        </Typography>
        <Typography sx={{ fontSize: '8px', mb: 0.2 }}>
          Fax.No: 251-112-362037
        </Typography>
        <Typography 
          sx={{ 
            fontSize: '8px', 
            color: '#87CEEB',
            textDecoration: 'underline'
          }}
        >
          Ambo.mbou.edu.et
        </Typography>
        <Typography sx={{ fontSize: '8px', mt: 0.2, fontStyle: 'italic' }}>
          Date of Issue: {issueDate}
        </Typography>
      </Box>

      {/* Main Content - Policy Section */}
      <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
        {/* Left - QR/Signature Area */}
        <Box sx={{ width: '70px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ 
            fontSize: '7px', 
            fontWeight: 'bold', 
            textAlign: 'center',
            borderBottom: '2px solid rgba(255,255,255,0.5)',
            pb: 0.5
          }}>
            Authorized
            <br />
            Signature
          </Box>
          <Box sx={{
            width: '100%',
            height: '50px',
            border: '1px dashed rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            ✓
          </Box>
        </Box>

        {/* Right - Policy Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography 
            sx={{ 
              fontSize: '9px', 
              fontWeight: 'bold', 
              mb: 0.6,
              color: '#FFD700'
            }}
          >
            Employee ID Card Use Policy
          </Typography>

          <Box sx={{ fontSize: '7px', lineHeight: 1.2, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {/* Policy Item 1 */}
            <Box sx={{ display: 'flex', gap: 0.3 }}>
              <Box sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                color: '#1e3c72',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                1
              </Box>
              <Typography sx={{ fontSize: '7px' }}>
                <strong>Official Use:</strong> University identification only.
              </Typography>
            </Box>

            {/* Policy Item 2 */}
            <Box sx={{ display: 'flex', gap: 0.3 }}>
              <Box sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                color: '#1e3c72',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                2
              </Box>
              <Typography sx={{ fontSize: '7px' }}>
                <strong>Keep Secure:</strong> Do not lend or share.
              </Typography>
            </Box>

            {/* Policy Item 3 */}
            <Box sx={{ display: 'flex', gap: 0.3 }}>
              <Box sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                color: '#1e3c72',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                3
              </Box>
              <Typography sx={{ fontSize: '7px' }}>
                <strong>Report Issues:</strong> Report lost/stolen immediately.
              </Typography>
            </Box>

            {/* Policy Item 4 */}
            <Box sx={{ display: 'flex', gap: 0.3 }}>
              <Box sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                color: '#1e3c72',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                4
              </Box>
              <Typography sx={{ fontSize: '7px' }}>
                <strong>Return:</strong> Deactivate at employment termination.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{
        borderTop: '1px solid rgba(255,255,255,0.3)',
        pt: 0.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '7px'
      }}>
        <Typography sx={{ fontSize: '7px' }}>
          Valid for entire employment
        </Typography>
        <Typography sx={{ fontSize: '7px' }}>
          © {new Date().getFullYear()} Ambo
        </Typography>
      </Box>
    </Box>
  );
}

export default EmployeeIDCardBack;
