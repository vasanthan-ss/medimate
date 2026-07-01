import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMedicine } from "../services/medicineService";
import { createSchedule } from "../services/scheduleService";

function AddMedicine() {
  const navigate = useNavigate();

  const [times, setTimes] = useState([""]);
  const [scheduleType, setScheduleType] = useState("EVERYDAY");
  const [selectedDays, setSelectedDays] = useState([]);

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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTimeChange = (index, value) => {
    setTimes((prev) =>
      prev.map((time, i) => (i === index ? value : time))
    );
  };

  const addTimeField = () => {
    setTimes((prev) => [...prev, ""]);
  };

  const removeTimeField = (index) => {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Medicine name is required");
      return;
    }

    const validTimes = times.filter((time) => time.trim());

    if (validTimes.length === 0) {
      setError("At least one reminder time is required");
      return;
    }

    if (scheduleType === "SELECTED" && selectedDays.length === 0) {
      setError("Please select at least one day");
      return;
    }

    try {
      setLoading(true);

      const medicineData = await createMedicine({
        name: formData.name,
        dosage: formData.dosage,
        instructions: formData.instructions,
        notes: formData.notes,
        stockCount: formData.stockCount,
        minimumStock: formData.minimumStock,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });

      await createSchedule({
        medicineId: medicineData.medicine.id,
        times: validTimes,
        daysOfWeek:
          scheduleType === "EVERYDAY" ? ["EVERYDAY"] : selectedDays,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });

      navigate("/medicines");
    } catch (err) {
    console.error("Add medicine or schedule error:", err);

    const backendMessage =
      err.response?.data?.message ||
      err.message ||
      "Failed to add medicine or schedule";

    setError(backendMessage);
  } finally {
    setLoading(false);
  }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Add Medicine</h2>
        <p className="text-muted mb-0">
          Add medicine details and set reminder time.
        </p>
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
                    placeholder="Example: Metformin"
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
                    placeholder="Example: 500mg"
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
                    placeholder="Example: After food"
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
                    placeholder="Optional notes"
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
                      placeholder="Example: 20"
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
                      placeholder="Example: 5"
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

                <hr className="my-4" />

                <h5 className="fw-bold mb-3">Reminder Time</h5>

                {times.map((time, index) => (
                  <div className="d-flex gap-2 mb-2" key={index}>
                    <input
                      type="time"
                      className="form-control"
                      value={time}
                      onChange={(e) =>
                        handleTimeChange(index, e.target.value)
                      }
                    />

                    {times.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removeTimeField(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mb-3"
                  onClick={addTimeField}
                >
                  + Add another time
                </button>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Days</label>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="scheduleType"
                      id="everyday"
                      checked={scheduleType === "EVERYDAY"}
                      onChange={() => setScheduleType("EVERYDAY")}
                    />
                    <label className="form-check-label" htmlFor="everyday">
                      Every day
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="scheduleType"
                      id="selectedDays"
                      checked={scheduleType === "SELECTED"}
                      onChange={() => setScheduleType("SELECTED")}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="selectedDays"
                    >
                      Select days
                    </label>
                  </div>
                </div>

                {scheduleType === "SELECTED" && (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                      (day) => (
                        <button
                          key={day}
                          type="button"
                          className={`btn btn-sm ${
                            selectedDays.includes(day)
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => toggleDay(day)}
                        >
                          {day}
                        </button>
                      )
                    )}
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Medicine"}
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

export default AddMedicine;