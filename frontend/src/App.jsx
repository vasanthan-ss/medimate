import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './lib/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import CaregiverDashboard from './pages/CaregiverDashboard.jsx';

function Topbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="topbar">
      <Link to="/">MediMate</Link>
      {user && (
        <div className="right">
          <span>
            {user.name} ({user.role})
          </span>
          <button onClick={logout}>Log out</button>
        </div>
      )}
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'CAREGIVER') return <Navigate to="/caregiver" replace />;
  return <Navigate to="/patient" replace />;
}

export default function App() {
  return (
    <>
      <Topbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregiver"
            element={
              <ProtectedRoute>
                <CaregiverDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}
