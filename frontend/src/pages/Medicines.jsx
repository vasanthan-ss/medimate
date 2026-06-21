import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

function Medicines() {
  return (
    <div>
      <PageHeader
        title="Medicines"
        subtitle="View and manage your medicines."
      />

      <div className="row">
        <div className="col-12 col-lg-6">
          <Card>
            <h2 className="h5 fw-bold mb-3">No medicines yet</h2>
            <p className="text-secondary">
              Add your first medicine to start using MediMate.
            </p>

            <Link to="/add-medicine" className="btn btn-primary fw-semibold">
              Add Medicine
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Medicines;