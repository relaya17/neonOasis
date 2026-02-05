import type { ReactNode } from 'react';
import { Component } from 'react';
import { Box, Button, Typography } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Global error boundary — PRD: Zero Lag UX, graceful failure */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (typeof console !== 'undefined' && console.error) {
      console.error('Neon Oasis ErrorBoundary:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0a0a0b',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ color: '#ff00ff', fontFamily: "'Orbitron', sans-serif", mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2, maxWidth: 400 }}>
            {this.state.error.message}
          </Typography>
          <Button
            variant="outlined"
            onClick={this.handleRetry}
            sx={{
              borderColor: '#00ffff',
              color: '#00ffff',
              '&:hover': { borderColor: '#00ffff', bgcolor: 'rgba(0,255,255,0.1)' },
            }}
          >
            Try again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
