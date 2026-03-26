import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import FocusMode from './pages/FocusMode';
import Forum from './pages/Forum'; // ✅ added

import MainLayout from './components/MainLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes with Sidebar Layout */}
          <Route element={<MainLayout />}>

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />

            {/* ✅ Forum added here */}
            <Route path="/forum" element={<Forum />} />

            <Route path="/focus" element={<FocusMode />} />
            <Route path="/profile" element={<Profile />} />

          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;