// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import './styles/globals.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/dashboard/:licenseNumber" element={<Dashboard />} />
                        <Route path="/upload/:licenseNumber" element={<Upload />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/admin" element={<Admin />} />
                    </Routes>
                </Layout>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'white',
                            color: 'var(--gray-900)',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--gray-200)',
                            borderRadius: 'var(--radius-lg)'
                        }
                    }}
                />
            </div>
        </Router>
    );
}

export default App;