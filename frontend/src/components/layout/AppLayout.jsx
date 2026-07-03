import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logoutUser } from "../../services/authService";
import Navbar from "./Navbar";

function AppLayout({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getMe();
        setUser(data.user);
      } catch (error) {
        logoutUser();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="mm-brand-icon mx-auto mb-3">M</div>
          <p className="text-secondary fw-semibold mb-0">
            Loading MediMate...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar user={user} />

      <main className="app-main">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;