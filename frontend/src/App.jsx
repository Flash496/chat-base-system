import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageSquare, Sparkles } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary transition-colors animate-fadeIn">
    <div className="relative flex items-center justify-center p-5 rounded-sm bg-bg-secondary border border-border-custom shadow-xl mb-4 animate-bounce">
      <MessageSquare className="w-7 h-7 text-accent-custom" />
      <Sparkles className="w-3.5 h-3.5 text-accent-custom absolute -top-1 -right-1 animate-pulse" />
    </div>
    <h1 className="text-xs font-bold text-text-primary tracking-widest uppercase flex items-center gap-1.5 justify-center">
      ProtoChat Engine
    </h1>
    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-1.5 flex gap-1 items-center justify-center">
      <span>Loading secure session</span>
      <span className="animate-pulse">...</span>
    </span>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? <Navigate to="/" /> : children;
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
