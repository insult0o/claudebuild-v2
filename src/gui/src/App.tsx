import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainApplicationShell } from './components/MainApplicationShell';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { ClaudeBuildStateProvider } from './providers/ClaudeBuildStateProvider';
import './App.css';

// ClaudeBuild v2.1.0 Superior GUI Theme
const claudeBuildTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4FF', // ClaudeBuild signature blue
      dark: '#0099CC',
      light: '#33DDFF'
    },
    secondary: {
      main: '#FF6B35', // Agent orchestration orange
      dark: '#CC5529',
      light: '#FF8A5F'
    },
    background: {
      default: '#0A0E27', // Deep professional blue
      paper: '#151B3D'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B8C5D1'
    }
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em'
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000,   // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});

function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={claudeBuildTheme}>
        <CssBaseline />
        <ClaudeBuildStateProvider>
          <WebSocketProvider>
            <MainApplicationShell />
          </WebSocketProvider>
        </ClaudeBuildStateProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;