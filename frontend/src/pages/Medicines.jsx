import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteMedicine,
  getMedicines,
  pauseMedicine,
} from "../services/medicineService";

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMedicines();
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

  const handlePause = async (id) => {
    try {
      setActionLoadingId(id);
      setError("");
      setSuccess("");

      const data = await pauseMedicine(id);

      setMedicines((prev) =>
        prev.map((medicine) =>
          medicine.id === id ? data.medicine : medicine
        )
      );

      setSuccess(data.message);
    } catch (err) {
      console.error("Pause medicine error:", err);
      setError(err.response?.data?.message || "Failed to update medicine");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medicine?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setActionLoadingId(id);
      setError("");
      setSuccess("");

      const data = await deleteMedicine(id);

      setMedicines((prev) => prev.filter((medicine) => medicine.id !== id));
      setSuccess(data.message);
    } catch (err) {
      console.error("Delete medicine error:", err);
      setError(err.response?.data?.message || "Failed to delete medicine");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Medicines</h2>
          <p className="text-muted mb-0">View and manage your medicines.</p>
        </div>

        <Link to="/add-medicine" className="btn btn-primary">
          + Add Medicine
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && <p>Loading medicines...</p>}

      {!loading && medicines.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5>No medicines added yet</h5>
            <p className="text-muted">
              Add your first medicine to start managing reminders.
            </p>
            <Link to="/add-medicine" className="btn btn-primary">
              Add Medicine
            </Link>
          </div>
        </div>
      )}

      <div className="row g-3">
        {medicines.map((medicine) => (
          <div className="col-12 col-md-6 col-lg-4" key={medicine.id}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">{medicine.name}</h5>
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

                {medicine.instructions && (
                  <p className="mb-2">
                    <strong>Instructions:</strong> {medicine.instructions}
                  </p>
                )}

                <p className="mb-2">
                  <strong>Stock:</strong> {medicine.stockCount}
                </p>

                <p className="mb-3">
                  <strong>Minimum alert:</strong> {medicine.minimumStock}
                </p>

                {medicine.stockCount <= medicine.minimumStock && (
                  <div className="alert alert-warning py-2">
                    Warning: Low Stock
                  </div>
                )}

                <div className="d-flex flex-wrap gap-2">
                  <Link
                    to={`/edit-medicine/${medicine.id}`}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Edit
                  </Link>

                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => handlePause(medicine.id)}
                    disabled={actionLoadingId === medicine.id}
                  >
                    {medicine.isActive ? "Pause" : "Resume"}
                  </button>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(medicine.id)}
                    disabled={actionLoadingId === medicine.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Medicines;