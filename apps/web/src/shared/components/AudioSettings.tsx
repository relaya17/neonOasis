/**
 * Audio Settings Component
 * Allows users to control sound effects and voice narration
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Stack,
  IconButton,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SettingsIcon from '@mui/icons-material/Settings';
import { 
  setSoundEnabled, 
  setSoundVolume, 
  setVoiceEnabled, 
  setVoiceVolume,
  playSound 
} from '../audio';

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';

interface AudioSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function AudioSettings({ open, onClose }: AudioSettingsProps) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [soundVolume, setSoundVolumeState] = useState(0.7);
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [voiceVolume, setVoiceVolumeState] = useState(0.8);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSoundEnabled = localStorage.getItem('audio_sound_enabled');
    const savedSoundVolume = localStorage.getItem('audio_sound_volume');
    const savedVoiceEnabled = localStorage.getItem('audio_voice_enabled');
    const savedVoiceVolume = localStorage.getItem('audio_voice_volume');

    if (savedSoundEnabled !== null) setSoundEnabledState(savedSoundEnabled === 'true');
    if (savedSoundVolume !== null) setSoundVolumeState(parseFloat(savedSoundVolume));
    if (savedVoiceEnabled !== null) setVoiceEnabledState(savedVoiceEnabled === 'true');
    if (savedVoiceVolume !== null) setVoiceVolumeState(parseFloat(savedVoiceVolume));
  }, []);

  const handleSoundEnabledChange = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundEnabled(enabled);
    localStorage.setItem('audio_sound_enabled', String(enabled));
    if (enabled) playSound('neon_click'); // Test sound
  };

  const handleSoundVolumeChange = (_: any, value: number | number[]) => {
    const vol = Array.isArray(value) ? value[0] : value;
    setSoundVolumeState(vol);
    setSoundVolume(vol);
    localStorage.setItem('audio_sound_volume', String(vol));
  };

  const handleSoundVolumeCommit = () => {
    playSound('neon_click'); // Test sound
  };

  const handleVoiceEnabledChange = (enabled: boolean) => {
    setVoiceEnabledState(enabled);
    setVoiceEnabled(enabled);
    localStorage.setItem('audio_voice_enabled', String(enabled));
  };

  const handleVoiceVolumeChange = (_: any, value: number | number[]) => {
    const vol = Array.isArray(value) ? value[0] : value;
    setVoiceVolumeState(vol);
    setVoiceVolume(vol);
    localStorage.setItem('audio_voice_volume', String(vol));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="audio-dialog-title"
      PaperProps={{
        sx: {
          bgcolor: 'rgba(26, 26, 26, 0.95)',
          border: `1px solid ${NEON_CYAN}44`,
          borderRadius: '15px',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <DialogTitle id="audio-dialog-title"
        sx={{
          color: NEON_CYAN,
          textAlign: 'center',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <SettingsIcon />
        Audio Settings
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={4} sx={{ py: 2 }}>
          {/* Sound Effects Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {soundEnabled ? <VolumeUpIcon sx={{ color: NEON_CYAN }} /> : <VolumeOffIcon sx={{ color: '#888' }} />}
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Sound Effects
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={soundEnabled}
                    onChange={(e) => handleSoundEnabledChange(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: NEON_CYAN,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: NEON_CYAN,
                      },
                    }}
                  />
                }
                label=""
              />
            </Box>
            <Slider
              value={soundVolume}
              onChange={handleSoundVolumeChange}
              onChangeCommitted={handleSoundVolumeCommit}
              min={0}
              max={1}
              step={0.01}
              disabled={!soundEnabled}
              valueLabelDisplay="auto"
              aria-label="עוצמת אפקטי קול"
              valueLabelFormat={(v: any) => `${Math.round(v * 100)}%`}
              sx={{
                color: soundEnabled ? NEON_CYAN : '#888',
                '& .MuiSlider-thumb': {
                  boxShadow: soundEnabled ? `0 0 10px ${NEON_CYAN}` : 'none',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 1 }}>
              Controls dice rolls, clicks, wins, and other game sounds
            </Typography>
          </Box>

          {/* Voice Narration Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RecordVoiceOverIcon sx={{ color: voiceEnabled ? NEON_PINK : '#888' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Voice Narration
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={voiceEnabled}
                    onChange={(e) => handleVoiceEnabledChange(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: NEON_PINK,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: NEON_PINK,
                      },
                    }}
                  />
                }
                label=""
              />
            </Box>
            <Slider
              value={voiceVolume}
              onChange={handleVoiceVolumeChange}
              min={0}
              max={1}
              step={0.01}
              disabled={!voiceEnabled}
              valueLabelDisplay="auto"
              valueLabelFormat={(v: any) => `${Math.round(v * 100)}%`}
              aria-label="עוצמת קול דיבוב"
              sx={{
                color: voiceEnabled ? NEON_PINK : '#888',
                '& .MuiSlider-thumb': {
                  boxShadow: voiceEnabled ? `0 0 10px ${NEON_PINK}` : 'none',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 1 }}>
              AI Dealer voice announcements and game commentary
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: NEON_CYAN,
            color: '#000',
            fontWeight: 'bold',
            px: 4,
            '&:hover': {
              bgcolor: NEON_CYAN,
              boxShadow: `0 0 20px ${NEON_CYAN}`,
            },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Audio Settings Button - Can be placed anywhere in the app
 */
export function AudioSettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          color: NEON_CYAN,
          '&:hover': {
            color: NEON_PINK,
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s',
        }}
        aria-label="Audio Settings"
      >
        <SettingsIcon />
      </IconButton>
      <AudioSettings open={open} onClose={() => setOpen(false)} />
    </>
  );
}
