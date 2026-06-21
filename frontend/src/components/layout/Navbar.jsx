import { NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";
import logo from "../../../../pictures/logo.png";
function Navbar({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top shadow-sm">
      <div className="container">
        <NavLink className="navbar-brand fw-bold text-primary fs-4" to="/home">
          <img  
            src={logo}
            alt="Medimate"
            style={{ height: '80px', width: 'auto' }}
            />
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <div className="navbar-nav mx-auto gap-lg-2">
            <NavLink className="nav-link fw-semibold" to="/home">
              Home
            </NavLink>

            <NavLink className="nav-link fw-semibold" to="/medicines">
              Medicines
            </NavLink>

            <NavLink className="nav-link fw-semibold" to="/add-medicine">
              Add Medicine
            </NavLink>

            <NavLink className="nav-link fw-semibold" to="/settings">
              Settings
            </NavLink>
          </div>

          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            {user && (
              <span className="fw-semibold text-secondary">{user.name}</span>
            )}

            <button className="btn btn-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;