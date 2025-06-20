// src/App.js - Updated with AuthSyncProvider and debugging
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import AuthSyncProvider from './components/AuthSyncProvider';

// Import your actual page components
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ComplianceDashboard from './pages/ComplianceDashboard';
import Upload from './pages/Upload';
import SecurityPage from './pages/SecurityPage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AuthCallback from './pages/AuthCallback';
import InactivityWarning from './components/InactivityWarning';

// Import your layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Import debugging component (only shows in development)
import AuthDebug from './components/AuthDebug';

// Import styles
import './styles/globals.css';

// Simple AuthErrorPage component (since it doesn't exist)
const AuthErrorPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('message') || 'Authentication error occurred';

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Authentication Error</h1>
            <p>{errorMessage}</p>
            <button onClick={() => window.location.href = '/'}>
                Return Home
            </button>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AuthSyncProvider>
                    <div className="App">
                        {/* Header */}
                        <Header />
                        <InactivityWarning />

                        {/* Main Content */}
                        <main className="main-content">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/dashboard/:licenseNumber" element={<Dashboard />} />
                                <Route path="/compliance/:licenseNumber" element={<ComplianceDashboard />} />
                                <Route path="/upload/:licenseNumber" element={<Upload />} />
                                <Route path="/security" element={<SecurityPage />} />
                                <Route path="/privacy" element={<Privacy />} />
                                <Route path="/terms" element={<Terms />} />
                                <Route path="/auth/callback" element={<AuthCallback />} />
                                <Route path="/auth/error" element={<AuthErrorPage />} />
                            </Routes>
                        </main>

                        {/* Footer */}
                        <Footer />

                        {/* Toast notifications */}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#363636',
                                    color: '#fff',
                                },
                                success: {
                                    duration: 3000,
                                    theme: {
                                        primary: '#4aed88',
                                    },
                                },
                                error: {
                                    duration: 5000,
                                    theme: {
                                        primary: '#ff4444',
                                    },
                                },
                            }}
                        />

                        {/* Auth Debug Component - only shows in development */}
                        <AuthDebug />
                    </div>
                </AuthSyncProvider>
            </Router>
        </AuthProvider>
    );
}

export default App;