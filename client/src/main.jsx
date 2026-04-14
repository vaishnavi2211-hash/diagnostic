import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LandingCartProvider } from './context/LandingCartContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LandingCartProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LandingCartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
