import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Grid,
    Paper
} from '@mui/material';
import { API_URL } from '../config';

function SmartCardGenerator({ student, onClose }) {
    const qrCanvasRef = useRef(null);
    const barcodeCanvasRef = useRef(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [barcodeUrl, setBarcodeUrl] = useState('');
    const [cardAlreadyExists, setCardAlreadyExists] = useState(false);
    const [fullStudentData, setFullStudentData] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (student) {
            // Fetch complete student data from backend
            console.log(`📚 Fetching complete student data for: ${student.student_id}`);
            fetch(`${API_URL}/api/students/info/${encodeURIComponent(student.student_id)}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                console.log('✅ Student data fetched:', data);
                console.log('   - Email:', data.personal_email);
                console.log('   - Emergency:', data.emergency_contact_name, data.emergency_contact_phone);
                setFullStudentData(data);
            })
            .catch(err => {
                console.error('❌ Error fetching student data:', err);
                setFullStudentData(student); // Fallback to passed student data
            });

            // Check if card already exists
            if(student.smart_card_id && student.smart_card_id !== ''){
                setCardAlreadyExists(true);
                console.log(`ℹ️ Viewing existing Smart ID: ${student.smart_card_id}`);
            } else {
                setCardAlreadyExists(false);
                console.log(`🆕 Generating new Smart ID for student`);
            }
        }
    }, [student, token]);

    // Separate useEffect to generate codes when fullStudentData updates
    useEffect(() => {
        if (student && fullStudentData) {
            console.log('🔄 Regenerating codes with full student data');
            generateQRCode();
            generateBarcode();
        }
    }, [fullStudentData]);

    const generateQRCode = async () => {
        try {
            // Use fullStudentData if available, otherwise use passed student
            const dataSource = fullStudentData || student;
            
            console.log('📱 Generating QR code with data:', {
                email: dataSource?.personal_email,
                emergency: dataSource?.emergency_contact_phone
            });
            
            // Use minimal data for low-density QR code with large modules
            const qrData = JSON.stringify({
                id: dataSource?.student_id,
                name: dataSource?.username || dataSource?.name,
                email: dataSource?.university_email,
                phone: dataSource?.phone_number,
                university: "Ambo University"
            });
            
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'L'
            });
            setQrCodeUrl(qrCodeDataUrl);
            console.log('✅ QR Code generated with minimal data for low density');
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const generateBarcode = () => {
        try {
            const canvas = barcodeCanvasRef.current;
            JsBarcode(canvas, student.student_id, {
                format: "CODE128",
                width: 3,
                height: 35,
                displayValue: false,
                margin: 2,
                background: "#ffffff",
                lineColor: "#000000"
            });
            
            const barcodeDataUrl = canvas.toDataURL();
            setBarcodeUrl(barcodeDataUrl);
        } catch (error) {
            console.error('Error generating barcode:', error);
        }
    };

    const downloadBothSidesPNG = async () => {
        try {
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default;
            
            // Get both card elements
            const frontCard = document.getElementById('smart-card-front');
            const backCard = document.getElementById('smart-card-back');
            
            if (!frontCard || !backCard) {
                alert('Card elements not found');
                return;
            }

            console.log('🖼️ Generating high-quality PNG at 300 DPI...');

            // At 300 DPI: 8.7cm = 1028px, 5.5cm = 650px
            const DPI = 300;
            const CM_TO_INCH = 0.393701;
            
            // Card dimensions in pixels at 300 DPI
            const cardWidthPx = Math.round(8.7 * CM_TO_INCH * DPI);  // 1028px
            const cardHeightPx = Math.round(5.5 * CM_TO_INCH * DPI); // 650px
            const spacingPx = Math.round(1.0 * CM_TO_INCH * DPI);    // 118px spacing (1cm)
            
            console.log(`📐 Card dimensions: ${cardWidthPx}x${cardHeightPx}px per side`);
            console.log(`📏 Total canvas: ${(cardWidthPx * 2 + spacingPx)}x${cardHeightPx}px`);

            // Create high-resolution canvas for front side
            const frontCanvas = await html2canvas(frontCard, {
                scale: 3.86, // Scale to achieve 300 DPI (1028px / 266.4px screen width)
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: frontCard.offsetWidth,
                height: frontCard.offsetHeight
            });

            // Create high-resolution canvas for back side
            const backCanvas = await html2canvas(backCard, {
                scale: 3.86, // Scale to achieve 300 DPI
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: backCard.offsetWidth,
                height: backCard.offsetHeight
            });

            console.log(`✅ Front canvas: ${frontCanvas.width}x${frontCanvas.height}px`);
            console.log(`✅ Back canvas: ${backCanvas.width}x${backCanvas.height}px`);

            // Create combined canvas
            const combinedWidth = cardWidthPx * 2 + spacingPx;
            const combinedHeight = cardHeightPx;
            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = combinedWidth;
            combinedCanvas.height = combinedHeight;
            const ctx = combinedCanvas.getContext('2d');

            // Fill with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, combinedWidth, combinedHeight);

            // Draw front card on the left
            ctx.drawImage(frontCanvas, 0, 0, cardWidthPx, cardHeightPx);

            // Draw back card on the right
            ctx.drawImage(backCanvas, cardWidthPx + spacingPx, 0, cardWidthPx, cardHeightPx);

            // Add center divider line
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(cardWidthPx + spacingPx / 2, 0);
            ctx.lineTo(cardWidthPx + spacingPx / 2, combinedHeight);
            ctx.stroke();

            // Add labels below cards
            ctx.setLineDash([]);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('FRONT SIDE', cardWidthPx / 2, combinedHeight - 20);
            ctx.fillText('BACK SIDE', cardWidthPx + spacingPx + cardWidthPx / 2, combinedHeight - 20);

            console.log(`🎨 Combined canvas created: ${combinedWidth}x${combinedHeight}px`);
            console.log(`📐 Physical size: 17.4cm x 5.5cm (at 300 DPI)`);

            // Convert to blob and download
            combinedCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${student.username || student.student_id}-SmartCard-BothSides-300DPI-${Date.now()}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                
                console.log('✅ PNG downloaded successfully!');
                alert('High-quality PNG (300 DPI) downloaded successfully!\n\nDimensions: 2055×650px\nPhysical size: 17.4cm × 5.5cm\nRecommended for professional printing.');
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('❌ Error generating PNG:', error);
            alert('Error generating PNG. Please try again.');
        }
    };

    const downloadBothSidesPDF = async () => {
        try {
            // Import required libraries
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');
            
            // Get both card elements
            const frontCard = document.getElementById('smart-card-front');
            const backCard = document.getElementById('smart-card-back');
            
            if (!frontCard || !backCard) {
                alert('Card elements not found');
                return;
            }

            // Create canvas for front side
            const frontCanvas = await html2canvas(frontCard, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: frontCard.offsetWidth,
                height: frontCard.offsetHeight
            });

            // Create canvas for back side
            const backCanvas = await html2canvas(backCard, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: backCard.offsetWidth,
                height: backCard.offsetHeight
            });

            // Create PDF in landscape orientation
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // A4 landscape dimensions: 297mm x 210mm
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Card dimensions: 87mm x 55mm (standard credit card size)
            const cardWidth = 87;
            const cardHeight = 55;

            // Calculate spacing
            const spacing = 10; // mm between cards
            const totalCardsWidth = (cardWidth * 2) + spacing;
            const startX = (pageWidth - totalCardsWidth) / 2;
            const startY = (pageHeight - cardHeight) / 2;

            // Convert front canvas to image
            const frontImgData = frontCanvas.toDataURL('image/png');
            pdf.addImage(frontImgData, 'PNG', startX, startY, cardWidth, cardHeight);

            // Convert back canvas to image
            const backImgData = backCanvas.toDataURL('image/png');
            pdf.addImage(backImgData, 'PNG', startX + cardWidth + spacing, startY, cardWidth, cardHeight);

            // Add text label below cards
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text('Front Side', startX + (cardWidth / 2), startY + cardHeight + 8, { align: 'center' });
            pdf.text('Back Side', startX + cardWidth + spacing + (cardWidth / 2), startY + cardHeight + 8, { align: 'center' });

            // Add metadata
            pdf.setProperties({
                title: `Smart ID - ${student.username || student.student_id}`,
                subject: 'Ambo University Student Smart Card',
                author: 'Ambo University',
                keywords: 'smart card, student id',
                creator: 'Smart Card Management System'
            });

            // Save the PDF
            pdf.save(`${student.username || student.student_id}-SmartCard-BothSides-${Date.now()}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    const downloadCard = async (side) => {
        try {
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default;
            
            // Get the card element - Fixed: swap front and back to match button labels
            const cardElement = document.getElementById(side === 'front' ? 'smart-card-front' : 'smart-card-back');
            
            if (!cardElement) {
                alert('Card element not found');
                return;
            }

            // Create canvas from the card element
            const canvas = await html2canvas(cardElement, {
                scale: 3, // High resolution (3x)
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: cardElement.offsetWidth,
                height: cardElement.offsetHeight
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${student.username || student.student_id}-${side}-${Date.now()}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('Error downloading card:', error);
            alert('Error downloading card. Please try again.');
        }
    };

    const printCard = () => {
        // Add print-specific styles
        const printStyles = `
            <style>
                @media print {
                    body * { visibility: hidden; }
                    .smart-card-print, .smart-card-print * { visibility: visible; }
                    .smart-card-print { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                    }
                    @page { 
                        margin: 0.5in;
                        size: landscape;
                    }
                }
            </style>
        `;
        
        // Add print styles to document head
        const styleElement = document.createElement('style');
        styleElement.innerHTML = printStyles;
        document.head.appendChild(styleElement);
        
        // Add print class to card elements
        const frontCard = document.getElementById('smart-card-front');
        const backCard = document.getElementById('smart-card-back');
        
        if (frontCard) frontCard.classList.add('smart-card-print');
        if (backCard) backCard.classList.add('smart-card-print');
        
        window.print();
        
        // Clean up
        setTimeout(() => {
            document.head.removeChild(styleElement);
            if (frontCard) frontCard.classList.remove('smart-card-print');
            if (backCard) backCard.classList.remove('smart-card-print');
        }, 1000);
    };

    if (!student) {
        return <Typography>No student data provided</Typography>;
    }

    return (
        <Box sx={{ padding: 3, maxWidth: 800, margin: '0 auto' }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" mb={1}>
                🎓 Ambo University Smart Card
            </Typography>
            
            <Typography color="gray" textAlign="center" mb={3}>
                አምቦ ዩኒቨርሲቲ - Digital Student ID Card Generation
            </Typography>
            
            {cardAlreadyExists && (
                <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    bgcolor: '#fff3cd', 
                    border: '2px solid #ffc107',
                    borderRadius: 2,
                    boxShadow: 2
                }}>
                    <Typography variant="h6" color="#856404" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        ⚠️ Smart ID Already Generated
                    </Typography>
                    <Typography color="#856404" sx={{ mb: 1 }}>
                        This student already has an active Smart ID: <strong>{student.smart_card_id}</strong>
                    </Typography>
                    <Typography color="#856404" fontSize="14px">
                        You are viewing the existing card. Use the download or print options below.
                        To generate a new card, please contact the system administrator.
                    </Typography>
                </Box>
            )}
            
            <Typography variant="h6" textAlign="center" mb={4}>
                {student.username || student.name || student.full_name} - {student.student_id}
            </Typography>

            <Grid container spacing={4} justifyContent="center">
                {/* FRONT SIDE */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Box 
                            id="smart-card-front"
                            sx={{ 
                                width: '8.7cm',
                                height: '5.5cm',
                                background: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 30%, #2196f3 60%, #00bcd4 100%)',
                                position: 'relative',
                                border: '2px solid rgba(33, 150, 243, 0.3)',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(4px)',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `
                                        radial-gradient(circle at 20% 30%, rgba(33, 150, 243, 0.15) 0%, transparent 40%),
                                        radial-gradient(circle at 80% 70%, rgba(0, 188, 212, 0.15) 0%, transparent 40%),
                                        radial-gradient(circle at 50% 50%, rgba(100, 181, 246, 0.08) 0%, transparent 50%)
                                    `,
                                    pointerEvents: 'none',
                                    zIndex: 0
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: '-50%',
                                    left: '-10%',
                                    width: '120%',
                                    height: '200%',
                                    background: `
                                        repeating-linear-gradient(
                                            90deg,
                                            transparent,
                                            transparent 40px,
                                            rgba(33, 150, 243, 0.03) 40px,
                                            rgba(33, 150, 243, 0.03) 41px
                                        ),
                                        repeating-linear-gradient(
                                            0deg,
                                            transparent,
                                            transparent 40px,
                                            rgba(0, 188, 212, 0.03) 40px,
                                            rgba(0, 188, 212, 0.03) 41px
                                        )
                                    `,
                                    opacity: 0.5,
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                    transform: 'rotate(-5deg)'
                                }
                            }}
                        >
                            {/* Front Card Premium Solid Header */}
                            <Box sx={{ 
                                width: '100%', 
                                background: '#0a1929',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'flex-start', 
                                px: 1.5, 
                                py: 0.8, 
                                gap: 1.5,
                                position: 'relative',
                                zIndex: 3,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                                borderBottom: '2px solid #00e5ff',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `
                                        linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.1) 100%),
                                        repeating-linear-gradient(
                                            45deg,
                                            transparent,
                                            transparent 3px,
                                            rgba(0,229,255,0.02) 3px,
                                            rgba(0,229,255,0.02) 6px
                                        )
                                    `,
                                    pointerEvents: 'none'
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: -2,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'linear-gradient(90deg, transparent 0%, #00e5ff 20%, #00e5ff 80%, transparent 100%)',
                                    boxShadow: '0 0 8px rgba(0,229,255,0.6)',
                                    pointerEvents: 'none'
                                }
                            }}>
                                <Box
                                    component="img"
                                    src="/images/ambo-university-logo.png"
                                    alt="Ambo University"
                                    sx={{
                                        height: 30,
                                        width: 'auto',
                                        objectFit: 'contain',
                                        position: 'relative',
                                        zIndex: 1,
                                        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(0,229,255,0.3))'
                                    }}
                                />
                                <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
                                    <Typography sx={{
                                        color: '#ffffff',
                                        fontWeight: '900',
                                        fontSize: '8.5px',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(0,229,255,0.4)',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase'
                                    }}>
                                        Ambo University
                                    </Typography>
                                    <Typography sx={{
                                        color: '#ffffff',
                                        fontWeight: '700',
                                        fontSize: '6px',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        textShadow: '0 2px 6px rgba(0,0,0,0.6), 0 0 10px rgba(255,255,255,0.3)',
                                        letterSpacing: '1px',
                                        mt: 0.2,
                                        opacity: 0.95
                                    }}>
                                        STUDENT IDENTIFICATION CARD
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ px: 1, py: 0.75, background: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 1 }}>
                                <Typography sx={{ fontSize: '5px', lineHeight: 1.4, color: '#333' }}>
                                    P.O.Box: 19
                                </Typography>
                                <Typography sx={{ fontSize: '5px', lineHeight: 1.4, color: '#333' }}>
                                    Tel.No: 251-112-362215
                                </Typography>
                                <Typography sx={{ fontSize: '5px', lineHeight: 1.4, color: '#333' }}>
                                    Fax.No: 251-112-362037
                                </Typography>
                                <Typography sx={{ fontSize: '5px', lineHeight: 1.4, color: '#1565c0' }}>
                                    Ambo.mbou.edu.et
                                </Typography>
                                <Typography sx={{ fontSize: '5px', lineHeight: 1.4, color: '#333', mt: 0.25 }}>
                                    Date of Issue: December 2024
                                </Typography>
                            </Box>

                            {/* Main Content Area */}
                            <Box sx={{ padding: 1, paddingRight: 3.5, pt: 0.75, position: 'relative', flex: 1, zIndex: 1, display: 'flex', flexDirection: 'row', gap: 0.6 }}>
                                
                                {/* QR Code - LEFT SIDE IN BLUE BOX */}
                                <Box sx={{ 
                                    background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 100%)',
                                    borderRadius: '12px',
                                    padding: 0.6,
                                    flexShrink: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    minWidth: 'fit-content',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                                }}>

                                    {qrCodeUrl && (
                                        <Box sx={{ 
                                            background: '#ffffff',
                                            borderRadius: '4px',
                                            padding: 0.2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            width: 72,
                                            height: 72,
                                            border: 'none'
                                        }}>
                                            <img 
                                                src={qrCodeUrl} 
                                                alt="QR Code" 
                                                style={{ 
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain',
                                                    imageRendering: 'crisp-edges'
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>

                                {/* RIGHT SIDE POLICY IN BLUE BOX */}
                                <Box sx={{ 
                                    flex: 1, 
                                    background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 100%)',
                                    borderRadius: '12px',
                                    padding: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    minHeight: 0
                                }}>
                                    {/* Policy Header */}
                                    <Box sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.3,
                                        px: 0.5,
                                        py: 0.25,
                                        background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 100%)',
                                        borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                                        flexShrink: 0
                                    }}>
                                        <Typography sx={{ fontSize: '5.5px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                            🎓
                                        </Typography>
                                        <Typography sx={{ fontSize: '5.5px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                            Student ID Card Use Policy
                                        </Typography>
                                    </Box>

                                    {/* Policy Content */}
                                    <Box sx={{ 
                                        flex: 1,
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        px: 0.5,
                                        py: 0.3,
                                        overflow: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.15
                                    }}>
                                        {/* Item 1 */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.25 }}>
                                            <Box sx={{ 
                                                background: '#1565c0',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: 12,
                                                height: 12,
                                                minWidth: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '4px',
                                                fontWeight: 'bold',
                                                mt: 0.05,
                                                flexShrink: 0
                                            }}>
                                                1
                                            </Box>
                                            <Typography sx={{ fontSize: '4px', lineHeight: 1.25, color: '#1a1a1a' }}>
                                                While enrolled: Right to use the Smart ID and university services; obligation to protect and use it properly.
                                            </Typography>
                                        </Box>

                                        {/* Item 2 */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.25 }}>
                                            <Box sx={{ 
                                                background: '#1565c0',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: 12,
                                                height: 12,
                                                minWidth: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '4px',
                                                fontWeight: 'bold',
                                                mt: 0.05,
                                                flexShrink: 0
                                            }}>
                                                2
                                            </Box>
                                            <Typography sx={{ fontSize: '4px', lineHeight: 1.25, color: '#1a1a1a' }}>
                                                After graduation: Right to use it for alumni identification/services; obligation not to use student-only privileges.
                                            </Typography>
                                        </Box>

                                        {/* Item 3 */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.25 }}>
                                            <Box sx={{ 
                                                background: '#1565c0',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: 12,
                                                height: 12,
                                                minWidth: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '4px',
                                                fontWeight: 'bold',
                                                mt: 0.05,
                                                flexShrink: 0
                                            }}>
                                                3
                                            </Box>
                                            <Typography sx={{ fontSize: '4px', lineHeight: 1.25, color: '#1a1a1a' }}>
                                                After withdrawal: Right to access authorized records; obligation to stop using the ID.
                                            </Typography>
                                        </Box>

                                        {/* Item 4 */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.25 }}>
                                            <Box sx={{ 
                                                background: '#1565c0',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: 12,
                                                height: 12,
                                                minWidth: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '4px',
                                                fontWeight: 'bold',
                                                mt: 0.05,
                                                flexShrink: 0
                                            }}>
                                                4
                                            </Box>
                                            <Typography sx={{ fontSize: '4px', lineHeight: 1.25, color: '#1a1a1a' }}>
                                                If lost: Report immediately, deactivate the ID, and request replacement.
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Authorized Signature - Outside Policy Box */}
                                <Box sx={{ 
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    px: 1,
                                    py: 0.3,
                                    background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    zIndex: 2
                                }}>
                                    <Typography sx={{ fontSize: '5px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                        Authorized Signature
                                    </Typography>
                                </Box>
                            </Box>

                            {/* NFC Icon */}
                            <Box sx={{ 
                                position: 'absolute',
                                bottom: 8,
                                right: 32,
                                width: 18,
                                height: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1
                            }}>
                                <Box sx={{
                                    width: 12,
                                    height: 8,
                                    border: '1px solid rgba(255,255,255,0.8)',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '4px',
                                    background: 'rgba(255, 255, 255, 0.3)',
                                    backdropFilter: 'blur(5px)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    📶
                                </Box>
                            </Box>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center', p: 1, background: '#f5f5f5' }}>
                            <Typography variant="caption" fontWeight="bold">
                                BACK SIDE - SMART I.D.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* BACK SIDE */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Box 
                            id="smart-card-back"
                            sx={{ 
                                width: '8.7cm',
                                height: '5.5cm',
                                background: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 30%, #2196f3 60%, #00bcd4 100%)',
                                position: 'relative',
                                border: '2px solid rgba(33, 150, 243, 0.3)',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(4px)',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `
                                        radial-gradient(circle at 70% 20%, rgba(33, 150, 243, 0.15) 0%, transparent 40%),
                                        radial-gradient(circle at 30% 80%, rgba(0, 188, 212, 0.15) 0%, transparent 40%),
                                        radial-gradient(circle at 50% 50%, rgba(100, 181, 246, 0.08) 0%, transparent 50%)
                                    `,
                                    pointerEvents: 'none',
                                    zIndex: 0
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: '-50%',
                                    right: '-10%',
                                    width: '120%',
                                    height: '200%',
                                    background: `
                                        repeating-linear-gradient(
                                            90deg,
                                            transparent,
                                            transparent 40px,
                                            rgba(33, 150, 243, 0.03) 40px,
                                            rgba(33, 150, 243, 0.03) 41px
                                        ),
                                        repeating-linear-gradient(
                                            0deg,
                                            transparent,
                                            transparent 40px,
                                            rgba(0, 188, 212, 0.03) 40px,
                                            rgba(0, 188, 212, 0.03) 41px
                                        )
                                    `,
                                    opacity: 0.5,
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                    transform: 'rotate(5deg)'
                                }
                            }}
                        >
                            {/* Back Card Premium Solid Header */}
                            <Box sx={{ 
                                width: '100%', 
                                background: '#0a1929',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'flex-start', 
                                px: 1.5, 
                                py: 0.8, 
                                gap: 1.5,
                                position: 'relative',
                                zIndex: 3,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                                borderBottom: '2px solid #00e5ff',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `
                                        linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.1) 100%),
                                        repeating-linear-gradient(
                                            45deg,
                                            transparent,
                                            transparent 3px,
                                            rgba(0,229,255,0.02) 3px,
                                            rgba(0,229,255,0.02) 6px
                                        )
                                    `,
                                    pointerEvents: 'none'
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: -2,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'linear-gradient(90deg, transparent 0%, #00e5ff 20%, #00e5ff 80%, transparent 100%)',
                                    boxShadow: '0 0 8px rgba(0,229,255,0.6)',
                                    pointerEvents: 'none'
                                }
                            }}>
                                <Box
                                    component="img"
                                    src="/images/ambo-university-logo.png"
                                    alt="Ambo University"
                                    sx={{
                                        height: 30,
                                        width: 'auto',
                                        objectFit: 'contain',
                                        position: 'relative',
                                        zIndex: 1,
                                        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(0,229,255,0.3))'
                                    }}
                                />
                                <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
                                    <Typography sx={{
                                        color: '#ffffff',
                                        fontWeight: '900',
                                        fontSize: '8.5px',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(0,229,255,0.4)',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase'
                                    }}>
                                        Ambo University
                                    </Typography>
                                    <Typography sx={{
                                        color: '#ffffff',
                                        fontWeight: '700',
                                        fontSize: '6px',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        textShadow: '0 2px 6px rgba(0,0,0,0.6), 0 0 10px rgba(255,255,255,0.3)',
                                        letterSpacing: '1px',
                                        mt: 0.2,
                                        opacity: 0.95
                                    }}>
                                        REGULAR STUDENT S I.D CARD
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Back Content */}
                            <Box sx={{ padding: 1, paddingRight: 3.5, position: 'relative', flex: 1, zIndex: 1 }}>
                                {/* Student Details - WITH NAME AND ACADEMIC INFO */}
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mb: 0.4, color: '#00e5ff', lineHeight: 1.2, textShadow: '0 0 10px rgba(0,229,255,0.7), 2px 2px 4px rgba(0,0,0,0.8)' }}>
                                        {student.username || student.name || student.full_name || 'STUDENT NAME'}
                                    </Typography>
                                    
                                    <Typography sx={{ fontSize: '7px', fontWeight: 'bold', mb: 0.4, lineHeight: 1.2, color: '#ffffff', textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0 0 5px rgba(33,150,243,0.4)' }}>
                                        STUDENT ID: {student.student_id}
                                    </Typography>
                                    
                                    <Typography sx={{ fontSize: '7px', fontWeight: 'bold', mb: 0.4, lineHeight: 1.2, color: '#ffffff', textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0 0 5px rgba(33,150,243,0.4)' }}>
                                        DEPARTMENT: {student.department || 'Computer Science'}
                                    </Typography>
                                    
                                    <Typography sx={{ fontSize: '7px', fontWeight: 'bold', mb: 0.4, lineHeight: 1.2, color: '#ffffff', textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0 0 5px rgba(33,150,243,0.4)' }}>
                                        PROGRAM: {student.program || 'Regular'}
                                    </Typography>
                                    
                                    <Typography sx={{ fontSize: '6.5px', fontWeight: 'bold', mb: 0.4, lineHeight: 1.2, color: '#ffd54f', textShadow: '0 0 8px rgba(255,213,79,0.6), 1px 1px 3px rgba(0,0,0,0.8)' }}>
                                        📧 {fullStudentData?.personal_email || student.personal_email || student.email || 'student@email.com'}
                                    </Typography>
                                    
                                    <Typography sx={{ fontSize: '7px', fontWeight: 'bold', mb: 0.5, lineHeight: 1.2, color: '#ffffff', textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0 0 5px rgba(33,150,243,0.4)' }}>
                                        EMERGENCY: {fullStudentData?.emergency_contact_name || student.emergency_contact_name || 'Emergency Contact'} - {fullStudentData?.emergency_contact_phone || student.emergency_contact_phone || '+251 911 234567'}
                                    </Typography>
                                </Box>

                                {/* Large Barcode - Horizontal at Bottom Center */}
                                <Box sx={{ 
                                    position: 'absolute',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    bottom: 12,
                                    width: 180,
                                    height: 35,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: 1,
                                    padding: 0.5,
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 1
                                }}>
                                    <canvas ref={barcodeCanvasRef} style={{ display: 'none' }} />
                                    {barcodeUrl && (
                                        <img 
                                            src={barcodeUrl} 
                                            alt="Barcode" 
                                            style={{ 
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain'
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Student Photo (top right) */}
                                <Box sx={{ 
                                    position: 'absolute',
                                    top: 4,
                                    right: 8,
                                    width: 77,
                                    height: 90,
                                    border: '3px solid rgba(255,255,255,0.9)',
                                    background: 'rgba(240, 240, 240, 0.98)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 2,
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                                    zIndex: 2,
                                    overflow: 'hidden'
                                }}>
                                    {student.photo ? (
                                        <img 
                                            src={`${API_URL}/uploads/${student.photo}`}
                                            alt="Student"
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                objectFit: 'cover',
                                                objectPosition: 'center',
                                                borderRadius: '1px' 
                                            }}
                                            onError={(e) => {
                                                console.error('Failed to load photo:', student.photo);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ fontSize: '8px', textAlign: 'center', color: '#999', fontWeight: 'bold' }}>
                                            PHOTO
                                        </Typography>
                                    )}
                                </Box>

                                {/* Security hologram placeholder - moved to bottom left */}
                                <Box sx={{ 
                                    position: 'absolute',
                                    bottom: 8,
                                    left: 8,
                                    width: 25,
                                    height: 25,
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(200,200,200,0.3))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 1,
                                    backdropFilter: 'blur(5px)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    zIndex: 2
                                }}>
                                    <Typography sx={{ fontSize: '5px', textAlign: 'center', color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                        🔒<br/>SEC
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ textAlign: 'center', p: 1, background: '#f5f5f5' }}>
                            <Typography variant="caption" fontWeight="bold">
                                FRONT SIDE - CARD DETAILS
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={printCard}
                    sx={{ mx: 1, mb: 1 }}
                >
                    🖨️ Print Card
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={() => downloadCard('front')}
                    sx={{ mx: 1, mb: 1 }}
                >
                    📥 Download Front
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={() => downloadCard('back')}
                    sx={{ mx: 1, mb: 1 }}
                >
                    📥 Download Back
                </Button>
                <Button 
                    variant="contained" 
                    color="success"
                    onClick={downloadBothSidesPNG}
                    sx={{ mx: 1, mb: 1 }}
                >
                    🖼️ Download Both Sides PNG (300 DPI)
                </Button>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={downloadBothSidesPDF}
                    sx={{ mx: 1, mb: 1 }}
                >
                    📄 Download Both Sides PDF
                </Button>
                {onClose && (
                    <Button 
                        variant="text" 
                        onClick={onClose}
                        sx={{ mx: 1, mb: 1 }}
                    >
                        ❌ Close
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default SmartCardGenerator;

