import { Button, type ButtonProps } from '@mui/material';
import { motion } from 'framer-motion';

/** MUI Button with neon glow — Framer Motion for smooth feedback */
export function NeonButton(props: ButtonProps) {
  return (
    <Button
      component={motion.button}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      sx={{
        boxShadow: '0 0 10px var(--neon-glow, #00ffff)',
        '&:hover': { boxShadow: '0 0 20px var(--neon-glow)' },
      }}
      {...props}
    />
  );
}
