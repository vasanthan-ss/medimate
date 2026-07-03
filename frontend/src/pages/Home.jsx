import { useEffect, useState } from "react";
import { getHomeSummary, getTodayMedicines } from "../services/homeService";
import {
  getTodayIntakes,
  markDoseSkipped,
  markDoseTaken,
} from "../services/intakeService";

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getTimeFromDateValue = (dateValue) => {
  const date = new Date(dateValue);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const getIntakeKey = (scheduleId, time) => {
  return `${scheduleId}-${time}`;
};

const getStatusBadgeClass = (status) => {
  if (status === "TAKEN") return "bg-success";
  if (status === "SKIPPED") return "bg-secondary";
  return "bg-light text-dark";
};

function Home() {
  const [todayMedicines, setTodayMedicines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError("");

      const [todayData, summaryData, intakeData] = await Promise.all([
        getTodayMedicines(),
        getHomeSummary(),
        getTodayIntakes(),
      ]);

      const intakeMap = {};

      (intakeData.intakeLogs || []).forEach((log) => {
        const time = getTimeFromDateValue(log.scheduledTime);
        intakeMap[getIntakeKey(log.scheduleId, time)] = log;
      });

      const medicinesWithStatus = (todayData.medicines || []).map(
        (medicine) => {
          const key = getIntakeKey(medicine.scheduleId, medicine.time);
          const intakeLog = intakeMap[key];

          return {
            ...medicine,
            intakeStatus: intakeLog?.status || null,
            intakeLogId: intakeLog?.id || null,
          };
        }
      );

      setTodayMedicines(medicinesWithStatus);
      setSummary(summaryData);
    } catch (err) {
      console.error("Home data error:", err);
      setError(err.response?.data?.message || "Failed to load home dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleIntakeAction = async (medicine, action) => {
    const key = getIntakeKey(medicine.scheduleId, medicine.time);

    try {
      setActionLoadingKey(key);
      setError("");
      setSuccess("");

      const payload = {
        scheduleId: medicine.scheduleId,
        medicineId: medicine.medicineId,
        time: medicine.time,
      };

      const data =
        action === "TAKEN"
          ? await markDoseTaken(payload)
          : await markDoseSkipped(payload);

      setSuccess(data.message);
      await fetchHomeData();
    } catch (err) {
      console.error("Intake action error:", err);
      setError(err.response?.data?.message || "Failed to update medicine dose");
    } finally {
      setActionLoadingKey("");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">{getGreeting()}</h2>
        <p className="text-muted mb-0">
          Here are your medicines scheduled for today.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && <p>Loading dashboard...</p>}

      {!loading && !error && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="fw-bold mb-2">Next Reminder</h5>

                  {summary?.nextReminder ? (
                    <>
                      <p className="mb-1">
                        <strong>{summary.nextReminder.name}</strong>{" "}
                        {summary.nextReminder.dosage || ""}
                      </p>
                      <p className="text-muted mb-0">
                        At {formatTime(summary.nextReminder.time)}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted mb-0">
                      No more reminders for today.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="fw-bold mb-2">Today Summary</h5>
                  <p className="mb-1">
                    <strong>{summary?.totalToday || 0}</strong> doses scheduled
                    today
                  </p>
                  <p className="text-muted mb-0">
                    Low stock medicines: {summary?.lowStockCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Today's Medicines</h5>

              {todayMedicines.length === 0 && (
                <p className="text-muted mb-0">
                  No medicines scheduled for today.
                </p>
              )}

              {todayMedicines.length > 0 && (
                <div className="d-flex flex-column gap-3">
                  {todayMedicines.map((medicine) => {
                    const key = getIntakeKey(
                      medicine.scheduleId,
                      medicine.time
                    );

                    return (
                      <div
                        className="border rounded p-3 d-flex flex-column flex-md-row justify-content-between gap-3"
                        key={key}
                      >
                        <div>
                          <p className="fw-bold mb-1">
                            {formatTime(medicine.time)} - {medicine.name}
                          </p>

                          <p className="text-muted mb-1">
                            {medicine.dosage || "No dosage added"}
                          </p>

                          {medicine.instructions && (
                            <p className="mb-0">
                              <strong>Instructions:</strong>{" "}
                              {medicine.instructions}
                            </p>
                          )}
                        </div>

                        <div className="d-flex flex-column align-items-start align-items-md-end gap-2">
                          {medicine.isLowStock && (
                            <span className="badge bg-warning text-dark">
                              Low stock
                            </span>
                          )}

                          {medicine.intakeStatus ? (
                            <span
                              className={`badge ${getStatusBadgeClass(
                                medicine.intakeStatus
                              )}`}
                            >
                              {medicine.intakeStatus}
                            </span>
                          ) : (
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                disabled={actionLoadingKey === key}
                                onClick={() =>
                                  handleIntakeAction(medicine, "TAKEN")
                                }
                              >
                                Taken
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={actionLoadingKey === key}
                                onClick={() =>
                                  handleIntakeAction(medicine, "SKIPPED")
                                }
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {summary?.lowStockMedicines?.length > 0 && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Low Stock</h5>

                {summary.lowStockMedicines.map((medicine) => (
                  <p
                    className="mb-2"
                    key={`low-stock-${medicine.medicineId}-${medicine.time}`}
                  >
                    {medicine.name} has only {medicine.stockCount} left.
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;