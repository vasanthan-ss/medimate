import { useEffect, useState } from "react";
import { getHomeSummary, getTodayMedicines } from "../services/homeService";

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

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

function Home() {
  const [todayMedicines, setTodayMedicines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError("");

      const [todayData, summaryData] = await Promise.all([
        getTodayMedicines(),
        getHomeSummary(),
      ]);

      setTodayMedicines(todayData.medicines || []);
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

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">{getGreeting()}</h2>
        <p className="text-muted mb-0">
          Here are your medicines scheduled for today.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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
                  {todayMedicines.map((medicine) => (
                    <div
                      className="border rounded p-3 d-flex flex-column flex-md-row justify-content-between gap-2"
                      key={`${medicine.scheduleId}-${medicine.time}`}
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

                      {medicine.isLowStock && (
                        <div>
                          <span className="badge bg-warning text-dark">
                            Low stock
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
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