/**
 * Holographic Chip with Parallax Effect
 * Moves with device orientation/mouse movement
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface HolographicChipProps {
  value: number;
  label?: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export function HolographicChip({ value, label, variant = 'primary', size = 'medium' }: HolographicChipProps) {
  const chipRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const sizeMap = {
    small: { width: 80, height: 80, fontSize: '1rem' },
    medium: { width: 120, height: 120, fontSize: '1.5rem' },
    large: { width: 160, height: 160, fontSize: '2rem' },
  };

  const colorMap = {
    primary: {
      bg: 'linear-gradient(135deg, #00f5d4 0%, #00a8cc 50%, #00f5d4 100%)',
      glow: '#00f5d4',
      text: '#000',
    },
    secondary: {
      bg: 'linear-gradient(135deg, #f72585 0%, #b5179e 50%, #f72585 100%)',
      glow: '#f72585',
      text: '#fff',
    },
  };

  const chipSize = sizeMap[size];
  const colors = colorMap[variant];

  useEffect(() => {
    // Device orientation (mobile)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        setRotateX(e.beta / 5); // -90 to 90 → -18 to 18
        setRotateY(e.gamma / 5); // -90 to 90 → -18 to 18
      }
    };

    // Mouse movement (desktop)
    const handleMouseMove = (e: MouseEvent) => {
      if (!chipRef.current) return;
      const rect = chipRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      setRotateY((deltaX / window.innerWidth) * 20); // -10 to 10
      setRotateX((-deltaY / window.innerHeight) * 20); // -10 to 10
    };

    // Check if DeviceOrientationEvent is available
    if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      // iOS 13+ requires permission
      // For now, use mouse fallback
      window.addEventListener('mousemove', handleMouseMove);
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation as any);
    } else {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as any);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <Box
      ref={chipRef}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1000,
        my: 2,
      }}
    >
      <motion.div
        style={{
          width: chipSize.width,
          height: chipSize.height,
          borderRadius: '50%',
          background: colors.bg,
          backgroundSize: '200% 200%',
          boxShadow: `0 0 40px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.3)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          position: 'relative',
          overflow: 'hidden',
        }}
        animate={{
          rotateX,
          rotateY,
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          rotateX: { type: 'spring', stiffness: 100, damping: 20 },
          rotateY: { type: 'spring', stiffness: 100, damping: 20 },
          backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
        }}
      >
        {/* Holographic reflection */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 2s infinite',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '200% 0%' },
              '100%': { backgroundPosition: '-200% 0%' },
            },
          }}
        />

        {/* Value */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: colors.text,
            textShadow: `0 0 10px ${colors.glow}`,
            fontSize: chipSize.fontSize,
            zIndex: 1,
            fontFamily: 'monospace',
          }}
        >
          {value.toLocaleString()}
        </Typography>

        {/* Label */}
        {label && (
          <Typography
            variant="caption"
            sx={{
              color: colors.text,
              opacity: 0.8,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: 1,
              zIndex: 1,
            }}
          >
            {label}
          </Typography>
        )}
      </motion.div>
    </Box>
  );
}
