import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { getMedicines } from "../services/medicineService";

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMedicines();

      console.log("Medicines API response:", data);

      setMedicines(data.medicines || []);
    } catch (err) {
      console.error("Fetch medicines error:", err);
      setError(err.response?.data?.message || "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  return (
    <div>
      <PageHeader
        title="Medicines"
        subtitle="View and manage your medicines"
      />

      <div className="mb-3">
        <Link to="/add-medicine" className="btn btn-primary">
          + Add Medicine
        </Link>
      </div>

      {loading && <p>Loading medicines...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && medicines.length === 0 && (
        <Card>
          <p className="mb-0 text-muted">
            No medicines added yet. Add your first medicine.
          </p>
        </Card>
      )}

      <div className="row g-3">
        {medicines.map((medicine) => (
          <div className="col-12 col-md-6 col-lg-4" key={medicine.id}>
            <Card>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="mb-1">{medicine.name}</h5>
                  <p className="text-muted mb-0">
                    {medicine.dosage || "No dosage added"}
                  </p>
                </div>

                <span
                  className={`badge ${
                    medicine.isActive ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {medicine.isActive ? "Active" : "Paused"}
                </span>
              </div>

              <p className="mb-1">
                <strong>Stock:</strong> {medicine.stockCount}
              </p>

              <p className="mb-3">
                <strong>Minimum alert:</strong> {medicine.minimumStock}
              </p>

              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary">
                  Edit
                </button>

                <button className="btn btn-sm btn-outline-warning">
                  {medicine.isActive ? "Pause" : "Resume"}
                </button>

                <button className="btn btn-sm btn-outline-danger">
                  Delete
                </button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Medicines;