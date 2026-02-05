/**
 * Quick Onboarding — 2 Click Flow
 * Reduces friction: AI Guardian + Play Now = 2 steps total
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useSessionStore } from './authStore';
import { useWalletStore } from '../store';
import { playSound } from '../../shared/audio';
import { playVoice } from '../../shared/audio/premiumSoundService';
import { hapticClick } from '../../shared/hooks';

const API_URL = import.meta.env.VITE_API_URL || '';

export function QuickOnboarding() {
  const [step, setStep] = useState<'guardian' | 'ready' | 'done'>('guardian');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setUserId = useSessionStore((s: any) => s.setUserId);
  const setUsername = useSessionStore((s: any) => s.setUsername);
  const fetchBalance = useWalletStore((s: any) => s.fetchBalance);
  const navigate = useNavigate();

  /**
   * Step 1: AI Guardian (1 second - simulated for now)
   */
  const handleGuardianCheck = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate AI Guardian face scan (1 second)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // TODO: Real Face API integration here
      const ageVerified = true; // Stub: always pass for demo
      
      if (!ageVerified) {
        setError('Age verification failed. Must be 18+');
        playVoice('guardian');
        return;
      }
      
      setStep('ready');
      playVoice('welcome');
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Play Now (auto-create account + free coins)
   */
  const handlePlayNow = async () => {
    setLoading(true);
    setError('');
    playSound('neon_click');
    hapticClick();
    
    try {
      // Auto-create guest account
      const res = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      
      if (res.ok && data.userId) {
        setUserId(data.userId);
        setUsername(data.username || 'Guest');
        
        // Grant welcome bonus (1000 free coins)
        // TODO: Backend should auto-grant this
        
        // Fetch initial balance
        await fetchBalance(data.userId);
        
        setStep('done');
        playVoice('reward');
        
        // Navigate to lobby after 1 second
        setTimeout(() => {
          navigate('/lobby');
        }, 1000);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        p: 3,
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h2"
          sx={{
            color: '#00ffff',
            fontWeight: 900,
            textShadow: '0 0 20px #00ffff',
            mb: 2,
            textAlign: 'center',
          }}
        >
          NEON OASIS
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: '#f72585',
            textAlign: 'center',
            mb: 6,
          }}
        >
          The Future of Skill Gaming
        </Typography>
      </motion.div>

      {/* Step 1: AI Guardian */}
      {step === 'guardian' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
              🛡️ AI Guardian
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 4 }}>
              Verify age (18+) to enter
            </Typography>
            
            {error && (
              <Typography variant="body2" sx={{ color: '#ff4d9a', mb: 2 }}>
                {error}
              </Typography>
            )}
            
            <Button
              variant="contained"
              size="large"
              onClick={handleGuardianCheck}
              disabled={loading}
              sx={{
                background: 'linear-gradient(90deg, #00f5d4, #f72585)',
                boxShadow: '0 0 20px rgba(0,245,212,0.5)',
                minWidth: 200,
                height: 56,
                fontSize: '1.1rem',
                fontWeight: 700,
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Age'}
            </Button>
            
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 2 }}>
              (Demo: Auto-pass in 1 second)
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Step 2: Play Now */}
      {step === 'ready' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            <Typography variant="h5" sx={{ color: '#00f5d4', mb: 2 }}>
              ✅ Age Verified
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
              Welcome to the Oasis
            </Typography>
            <Typography variant="body2" sx={{ color: '#f72585', mb: 4 }}>
              Get 1,000 free coins to start playing!
            </Typography>
            
            {error && (
              <Typography variant="body2" sx={{ color: '#ff4d9a', mb: 2 }}>
                {error}
              </Typography>
            )}
            
            <Button
              variant="contained"
              size="large"
              onClick={handlePlayNow}
              disabled={loading}
              sx={{
                background: 'linear-gradient(90deg, #f72585, #00f5d4)',
                boxShadow: '0 0 30px rgba(247,37,133,0.6)',
                minWidth: 200,
                height: 56,
                fontSize: '1.1rem',
                fontWeight: 700,
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Play Now 🎰'}
            </Button>
          </Box>
        </motion.div>
      )}

      {/* Step 3: Done (transitioning) */}
      {step === 'done' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#00f5d4', mb: 2 }}>
              🎉 Welcome!
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc' }}>
              Loading your table...
            </Typography>
            <CircularProgress sx={{ mt: 3, color: '#00f5d4' }} />
          </Box>
        </motion.div>
      )}

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 20,
          color: '#666',
          textAlign: 'center',
        }}
      >
        2 clicks. 10 seconds. Zero hassle.
      </Typography>
    </Box>
  );
}
