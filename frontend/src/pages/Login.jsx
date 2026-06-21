import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import logo from "../../../pictures/logo.png";
function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);
      localStorage.setItem("token", data.token);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
      <div className="card border-0 shadow-sm rounded-4 w-100" style={{ maxWidth: "420px" }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <img src={logo} alt="logo" style={{ height: '80px', width: 'auto' }}></img>
            <p className="text-secondary mb-0">Login to your account</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                name="email"
                type="email"
                className="form-control form-control-lg"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                name="password"
                type="password"
                className="form-control form-control-lg"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 fw-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-secondary mt-4 mb-0">
            New user?{" "}
            <Link to="/register" className="fw-semibold text-decoration-none">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;