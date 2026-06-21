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
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <p className="text-secondary fw-semibold">Loading MediMate...</p>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar user={user} />

      <main className="container py-4">{children}</main>
    </div>
  );
}

export default AppLayout;