import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function CardPreview() {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" mb={2} textAlign="center">
                📋 Smart Card Design Preview
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                {/* Front Preview */}
                <Paper elevation={6} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{
                        width: 200,
                        height: 126,
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                        position: 'relative',
                        border: '1px solid #ddd'
                    }}>

                        {/* Front Preview Header */}
                        <Box sx={{ width: '100%', background: '#42a5f5', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', px: 0.5, py: 0.35, gap: 0.5 }}>
                            <Box
                                component="img"
                                src="/images/ambo-university-logo.png"
                                alt="Ambo University"
                                sx={{ height: 12, width: 'auto', objectFit: 'contain' }}
                            />
                            <Typography sx={{ color: 'white', fontSize: '4px', fontWeight: 'bold', textAlign: 'center', flex: 1, whiteSpace: 'nowrap' }}>
                                Ambo University Student I.D Card
                            </Typography>
                        </Box>
                        
                        {/* Content preview */}
                        <Box sx={{ p: 1, pr: 2, pt: 0.5 }}>
                            <Typography sx={{ fontSize: '6px', mb: 0.5 }}>
                                Student Name
                            </Typography>
                            <Typography sx={{ fontSize: '5px', mb: 0.5 }}>
                                Department
                            </Typography>
                            <Typography sx={{ fontSize: '5px' }}>
                                ID: 2026-XXXX
                            </Typography>
                            
                            {/* QR Code placeholder */}
                            <Box sx={{
                                position: 'absolute',
                                top: 35,
                                left: 50,
                                width: 25,
                                height: 25,
                                border: '1px solid #666',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '4px'
                            }}>
                                QR
                            </Box>
                            
                            {/* Photo placeholder */}
                            <Box sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                width: 30,
                                height: 35,
                                border: '1px solid #666',
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '5px'
                            }}>
                                PHOTO
                            </Box>
                        </Box>
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', p: 1, bgcolor: '#f5f5f5' }}>
                        BACK - QR CODE
                    </Typography>
                </Paper>

                {/* Back Preview */}
                <Paper elevation={6} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{
                        width: 200,
                        height: 126,
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                        position: 'relative',
                        border: '1px solid #ddd'
                    }}>
                        {/* Back Preview Header */}
                        <Box sx={{ width: '100%', background: '#42a5f5', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', px: 0.5, py: 0.35, gap: 0.5 }}>
                            <Box
                                component="img"
                                src="/images/ambo-university-logo.png"
                                alt="Ambo University"
                                sx={{ height: 12, width: 'auto', objectFit: 'contain' }}
                            />
                            <Typography sx={{ color: 'white', fontSize: '4px', fontWeight: 'bold', textAlign: 'center', flex: 1, whiteSpace: 'nowrap' }}>
                                Regular Student S I.D Card
                            </Typography>
                        </Box>
                        
                        {/* Content preview */}
                        <Box sx={{ p: 1, pr: 4, textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '6px', fontWeight: 'bold', mb: 0.5 }}>
                                NAME:
                            </Typography>
                            <Typography sx={{ fontSize: '5px', mb: 1 }}>
                                Student Name
                            </Typography>
                            
                            <Typography sx={{ fontSize: '6px', fontWeight: 'bold', mb: 0.5 }}>
                                ID.No:
                            </Typography>
                            <Typography sx={{ fontSize: '5px', mb: 1 }}>
                                2026-XXXX
                            </Typography>
                            
                            <Typography sx={{ fontSize: '6px', fontWeight: 'bold' }}>
                                PROGRAM: IT
                            </Typography>
                        </Box>
                        
                        {/* Barcode placeholder */}
                        <Box sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 50,
                            height: 15,
                            border: '1px solid #666',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '5px'
                        }}>
                            ||||||||||||
                        </Box>
                        
                        {/* Small photo */}
                        <Box sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 38,
                            width: 20,
                            height: 25,
                            border: '1px solid #666',
                            background: '#e8f5e8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '4px'
                        }}>
                            PH
                        </Box>
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', p: 1, bgcolor: '#f5f5f5' }}>
                        FRONT - BARCODE
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
}

export default CardPreview;