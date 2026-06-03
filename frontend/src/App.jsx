import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateMeeting from './pages/CreateMeeting';
import MeetingDetails from './pages/MeetingDetails';

function App() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="app-container">
        {/* Render Navbar only if the user is logged in */}
        {token && (
          <nav className="navbar">
            <div className="navbar-brand">
              <Link to="/">💼 AI Meeting Summarizer</Link>
            </div>
            <div className="navbar-links">
              <span className="navbar-user">
                Signed in as <strong>{username}</strong>
              </span>
              <Link to="/">Dashboard</Link>
              <button 
                onClick={handleLogout} 
                className="btn btn-sm btn-danger"
                style={{ marginLeft: '1rem' }}
              >
                Log Out
              </button>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-meeting" 
            element={
              <ProtectedRoute>
                <CreateMeeting />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/meetings/:id" 
            element={
              <ProtectedRoute>
                <MeetingDetails />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
