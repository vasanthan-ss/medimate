import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { createMedicine } from "../services/medicineService";

function AddMedicine() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    stockCount: "",
    minimumStock: "",
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

    if (!formData.name.trim()) {
      setError("Medicine name is required");
      return;
    }

    try {
      setLoading(true);

      await createMedicine({
        name: formData.name,
        dosage: formData.dosage,
        stockCount: Number(formData.stockCount) || 0,
        minimumStock: Number(formData.minimumStock) || 5,
      });

      navigate("/medicines");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add medicine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Medicine"
        subtitle="Add basic medicine details. Reminder time will be added later."
      />

      <div className="row">
        <div className="col-12 col-lg-7">
          <Card>
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Medicine Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Example: Metformin"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Dosage
                </label>
                <input
                  type="text"
                  name="dosage"
                  className="form-control"
                  placeholder="Example: 500mg"
                  value={formData.dosage}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Stock Count
                </label>
                <input
                  type="number"
                  name="stockCount"
                  className="form-control"
                  placeholder="Example: 20"
                  value={formData.stockCount}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Minimum Stock Alert
                </label>
                <input
                  type="number"
                  name="minimumStock"
                  className="form-control"
                  placeholder="Example: 5"
                  value={formData.minimumStock}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Medicine"}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AddMedicine;