// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n'; // Internacionalização
import './index.css';
import { AppRoutes } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlbumProvider } from './contexts/AlbumContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <AlbumProvider> 
          <AppRoutes />
        </AlbumProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);