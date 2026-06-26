import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getMedicineById,
  updateMedicine,
} from "../services/medicineService";

function formatDateForInput(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function EditMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    instructions: "",
    notes: "",
    stockCount: "",
    minimumStock: "",
    startDate: "",
    endDate: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setPageLoading(true);
        setError("");

        const data = await getMedicineById(id);
        const medicine = data.medicine;

        setFormData({
          name: medicine.name || "",
          dosage: medicine.dosage || "",
          instructions: medicine.instructions || "",
          notes: medicine.notes || "",
          stockCount: medicine.stockCount ?? "",
          minimumStock: medicine.minimumStock ?? "",
          startDate: formatDateForInput(medicine.startDate),
          endDate: formatDateForInput(medicine.endDate),
        });
      } catch (err) {
        console.error("Fetch medicine error:", err);
        setError(err.response?.data?.message || "Failed to load medicine");
      } finally {
        setPageLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

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
      setSaving(true);

      await updateMedicine(id, {
        name: formData.name,
        dosage: formData.dosage,
        instructions: formData.instructions,
        notes: formData.notes,
        stockCount: formData.stockCount,
        minimumStock: formData.minimumStock,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });

      navigate("/medicines");
    } catch (err) {
      console.error("Update medicine error:", err);
      setError(err.response?.data?.message || "Failed to update medicine");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return <p>Loading medicine...</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Edit Medicine</h2>
        <p className="text-muted mb-0">Update medicine details.</p>
      </div>

      <div className="row">
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Medicine Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Dosage</label>
                  <input
                    type="text"
                    name="dosage"
                    className="form-control"
                    value={formData.dosage}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Instructions
                  </label>
                  <input
                    type="text"
                    name="instructions"
                    className="form-control"
                    value={formData.instructions}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Stock Count
                    </label>
                    <input
                      type="number"
                      name="stockCount"
                      className="form-control"
                      value={formData.stockCount}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Minimum Stock Alert
                    </label>
                    <input
                      type="number"
                      name="minimumStock"
                      className="form-control"
                      value={formData.minimumStock}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      className="form-control"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="form-control"
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Updating..." : "Update Medicine"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => navigate("/medicines")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditMedicine;