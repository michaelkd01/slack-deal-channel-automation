import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateChannel from './pages/CreateChannel';
import Channels from './pages/Channels';
import Settings from './pages/Settings';
import Setup from './pages/Setup';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A154B',
    },
    secondary: {
      main: '#1264A3',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create" element={<CreateChannel />} />
            <Route path="channels" element={<Channels />} />
            <Route path="settings" element={<Settings />} />
            <Route path="setup" element={<Setup />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
