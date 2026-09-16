import React from 'react';
import { Box } from '@mui/material';

/**
 * Premium QR Code Card Component
 * Displays QR code with elegant green corner brackets, white card background,
 * soft shadow, and professional styling
 */
const QRCodeCard = ({ qrCodeUrl, size = 90, cornerBracketColor = '#18B86A' }) => {
    const bracketSize = size * 0.25; // 25% of QR code size
    const bracketThickness = size * 0.04; // 4% thickness
    const cardPadding = size * 0.12; // 12% padding around QR

    return (
        <Box
            sx={{
                position: 'relative',
                width: size + cardPadding * 2,
                height: size + cardPadding * 2,
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '12px',
                padding: `${cardPadding}px`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(200, 200, 200, 0.3)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
        >
            {/* QR Code Image */}
            {qrCodeUrl && (
                <Box
                    component="img"
                    src={qrCodeUrl}
                    alt="QR Code"
                    sx={{
                        width: size,
                        height: size,
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                        imageRendering: 'crisp-edges',
                        position: 'relative',
                        zIndex: 2
                    }}
                />
            )}

            {/* Top-Left Corner Bracket */}
            <Box
                sx={{
                    position: 'absolute',
                    top: cardPadding - bracketThickness / 2,
                    left: cardPadding - bracketThickness / 2,
                    width: bracketSize,
                    height: bracketSize,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: bracketSize,
                        height: bracketThickness,
                        background: cornerBracketColor,
                        borderRadius: `${bracketThickness}px 0 0 0`
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: bracketThickness,
                        height: bracketSize,
                        background: cornerBracketColor,
                        borderRadius: `${bracketThickness}px 0 0 0`
                    }
                }}
            />

            {/* Top-Right Corner Bracket */}
            <Box
                sx={{
                    position: 'absolute',
                    top: cardPadding - bracketThickness / 2,
                    right: cardPadding - bracketThickness / 2,
                    width: bracketSize,
                    height: bracketSize,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: bracketSize,
                        height: bracketThickness,
                        background: cornerBracketColor,
                        borderRadius: `0 ${bracketThickness}px 0 0`
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: bracketThickness,
                        height: bracketSize,
                        background: cornerBracketColor,
                        borderRadius: `0 ${bracketThickness}px 0 0`
                    }
                }}
            />

            {/* Bottom-Left Corner Bracket */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: cardPadding - bracketThickness / 2,
                    left: cardPadding - bracketThickness / 2,
                    width: bracketSize,
                    height: bracketSize,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: bracketSize,
                        height: bracketThickness,
                        background: cornerBracketColor,
                        borderRadius: `0 0 0 ${bracketThickness}px`
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: bracketThickness,
                        height: bracketSize,
                        background: cornerBracketColor,
                        borderRadius: `0 0 0 ${bracketThickness}px`
                    }
                }}
            />

            {/* Bottom-Right Corner Bracket */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: cardPadding - bracketThickness / 2,
                    right: cardPadding - bracketThickness / 2,
                    width: bracketSize,
                    height: bracketSize,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: bracketSize,
                        height: bracketThickness,
                        background: cornerBracketColor,
                        borderRadius: `0 0 ${bracketThickness}px 0`
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: bracketThickness,
                        height: bracketSize,
                        background: cornerBracketColor,
                        borderRadius: `0 0 ${bracketThickness}px 0`
                    }
                }}
            />
        </Box>
    );
};

export default QRCodeCard;
