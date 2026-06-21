import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

function AddMedicine() {
  return (
    <div>
      <PageHeader
        title="Add Medicine"
        subtitle="The medicine form will be built in Part 4."
      />

      <div className="row">
        <div className="col-12 col-lg-7">
          <Card>
            <h2 className="h5 fw-bold mb-3">Medicine form coming next</h2>
            <p className="text-secondary mb-0">
              In the next part, this page will allow users to add medicine name,
              dosage, stock, and low-stock alert number.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AddMedicine;