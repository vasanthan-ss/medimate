import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

function Home() {
  return (
    <div>
      <PageHeader
        title="Home"
        subtitle="Today’s medicine reminders will appear here."
      />

      <div className="row g-4">
        <div className="col-12 col-md-6 col-lg-4">
          <Card>
            <h2 className="h5 fw-bold mb-3">Today’s Medicines</h2>
            <p className="text-secondary mb-0">No medicines added yet.</p>
          </Card>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <Card>
            <h2 className="h5 fw-bold mb-3">Next Reminder</h2>
            <p className="text-secondary mb-0">
              Your next reminder will appear here after you add medicines.
            </p>
          </Card>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <Card>
            <h2 className="h5 fw-bold mb-3">Low Stock</h2>
            <p className="text-secondary mb-0">
              No low-stock medicines right now.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Home;