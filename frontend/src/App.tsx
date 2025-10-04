import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Toaster } from './components/ui/toaster';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import { useEffect } from 'react';

function App() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route
          path="/workspace/:workspaceId/*"
          element={user ? <WorkspacePage /> : <Navigate to="/login" />}
        />
        <Route path="/" element={user ? <Navigate to="/workspace" /> : <Navigate to="/login" />} />
        <Route path="/workspace" element={user ? <WorkspacePage /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
