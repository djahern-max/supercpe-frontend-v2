// src/App.js - Fixed with correct imports
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Import your actual page components (using correct names)
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ComplianceDashboard from './pages/ComplianceDashboard';
import Pricing from './pages/Pricing';
import Upload from './pages/Upload';
import SecurityPage from './pages/SecurityPage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Import your layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

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
                <div className="App">
                    {/* Header */}
                    <Header />

                    {/* Main Content */}
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/dashboard/:licenseNumber" element={<Dashboard />} />
                            <Route path="/compliance/:licenseNumber" element={<ComplianceDashboard />} />
                            <Route path="/upload/:licenseNumber" element={<Upload />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/security" element={<SecurityPage />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/auth/error" element={<AuthErrorPage />} />

                            {/* Catch all route */}
                            <Route path="*" element={<Home />} />
                        </Routes>
                    </main>

                    {/* Footer */}
                    <Footer />

                    {/* Toast Notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                                fontSize: '14px',
                                borderRadius: '8px',
                                padding: '12px 16px',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;