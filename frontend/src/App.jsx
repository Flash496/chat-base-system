import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';

const PrivateRoute = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 bg-accent-custom rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 bg-accent-custom rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 bg-accent-custom rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" />;

  // Redirect if they have registered an email but haven't verified it yet
  const isUnverified = user && ((user.email && !user.isEmailVerified) || (user.phone && !user.isPhoneVerified));
  if (isUnverified) {
    return <Navigate to="/verify" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? <Navigate to="/" /> : children;
};

const VerifyRoute = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" />;

  const isUnverified = user && ((user.email && !user.isEmailVerified) || (user.phone && !user.isPhoneVerified));
  return isUnverified ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/verify"
            element={
              <VerifyRoute>
                <Verify />
              </VerifyRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
