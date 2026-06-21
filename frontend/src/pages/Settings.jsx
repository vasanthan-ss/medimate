import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

function Settings() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Profile and reminder settings will appear here later."
      />

      <div className="row">
        <div className="col-12 col-lg-7">
          <Card>
            <h2 className="h5 fw-bold mb-3">Basic settings</h2>
            <p className="text-secondary mb-0">
              Name, phone, timezone, SMS toggle, and grace period will be added
              later.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Settings;