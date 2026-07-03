import { NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";
import logo from "../../assets/logo.png";

function Navbar({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top mm-navbar">
      <div className="container-fluid px-3 px-md-4">
        <NavLink className="navbar-brand d-flex align-items-center py-0" to="/home">
          <img
            src={logo}
            alt="MediMate"
            width="96"
            height="32"
            className="img-fluid d-inline-block align-text-top"
          />
        </NavLink>

        <button
          className="navbar-toggler border-0"
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
          <div className="navbar-nav mx-auto gap-lg-2 mt-3 mt-lg-0">
            <NavLink className="nav-link mm-nav-link" to="/home">
              Home
            </NavLink>

            <NavLink className="nav-link mm-nav-link" to="/medicines">
              Medicines
            </NavLink>

            <NavLink className="nav-link mm-nav-link" to="/add-medicine">
              Add Medicine
            </NavLink>

            <NavLink className="nav-link mm-nav-link" to="/settings">
              Settings
            </NavLink>
          </div>

          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            {user && (
              <span className="fw-semibold text-secondary">
                {user.name}
              </span>
            )}

            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;