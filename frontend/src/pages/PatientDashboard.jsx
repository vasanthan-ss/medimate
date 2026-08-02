import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { api } from '../lib/api.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StatusPill({ status }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}

function ScheduleForm({ medicationId, onCreated }) {
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/medications/${medicationId}/schedules`, {
        timeOfDay,
        daysOfWeek: days,
        gracePeriodMinutes: Number(gracePeriodMinutes),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline" onSubmit={handleSubmit}>
      <input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} required />
      <div>
        {DAY_LABELS.map((label, i) => (
          <label key={i} style={{ marginRight: 6, fontSize: '0.8rem' }}>
            <input type="checkbox" checked={days.includes(i)} onChange={() => toggleDay(i)} /> {label}
          </label>
        ))}
      </div>
      <input
        type="number"
        min={1}
        value={gracePeriodMinutes}
        onChange={(e) => setGracePeriodMinutes(e.target.value)}
        style={{ width: 70 }}
        title="Grace period (minutes)"
      />
      <button type="submit" disabled={submitting}>Add schedule</button>
      {error && <span className="error-banner">{error}</span>}
    </form>
  );
}

function AddMedicationForm({ onCreated }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('tablet');
  const [stockQuantity, setStockQuantity] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/medications', { name, dosage, form, stockQuantity: Number(stockQuantity) });
      setName('');
      setDosage('');
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline" onSubmit={handleSubmit}>
      <input placeholder="Name (e.g. Metformin)" value={name} onChange={(e) => setName(e.target.value)} required />
      <input placeholder="Dosage (e.g. 500mg)" value={dosage} onChange={(e) => setDosage(e.target.value)} required />
      <select value={form} onChange={(e) => setForm(e.target.value)}>
        <option value="tablet">tablet</option>
        <option value="syrup">syrup</option>
        <option value="injection">injection</option>
      </select>
      <input
        type="number"
        min={0}
        value={stockQuantity}
        onChange={(e) => setStockQuantity(e.target.value)}
        style={{ width: 80 }}
        title="Stock quantity"
      />
      <button type="submit" disabled={submitting}>Add medication</button>
      {error && <div className="error-banner">{error}</div>}
    </form>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [busyLogId, setBusyLogId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [medsRes, dashRes, linksRes] = await Promise.all([
        api.get(`/medications?patientId=${user.id}`),
        api.get(`/patients/${user.id}/dashboard`),
        api.get('/links'),
      ]);
      setMedications(medsRes.data);
      setDashboard(dashRes);
      setLinks(linksRes.data);
    } catch (err) {
      setError(err.message);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDose(logId) {
    setBusyLogId(logId);
    try {
      await api.post(`/intake-logs/${logId}/confirm`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyLogId(null);
    }
  }

  async function snoozeDose(logId) {
    setBusyLogId(logId);
    try {
      await api.post(`/intake-logs/${logId}/snooze`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyLogId(null);
    }
  }

  async function inviteCaregiver(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/links', { caregiverEmail: inviteEmail, relationship: inviteRelationship });
      setInviteEmail('');
      setInviteRelationship('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const adherencePct =
    dashboard?.adherenceThisWeek?.adherenceRate != null
      ? Math.round(dashboard.adherenceThisWeek.adherenceRate * 100)
      : null;

  return (
    <div>
      <h1>Your medications</h1>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>Today</h2>
        {dashboard?.today?.length ? (
          <table>
            <thead>
              <tr><th>Medication</th><th>Time</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {dashboard.today.map((log) => (
                <tr key={log.id}>
                  <td>{log.medicationName}</td>
                  <td>{new Date(log.scheduledTime).toLocaleTimeString()}</td>
                  <td><StatusPill status={log.status} /></td>
                  <td>
                    {log.status === 'PENDING' && (
                      <>
                        <button onClick={() => confirmDose(log.id)} disabled={busyLogId === log.id}>
                          Mark taken
                        </button>{' '}
                        <button className="secondary" onClick={() => snoozeDose(log.id)} disabled={busyLogId === log.id}>
                          Snooze
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No doses scheduled for today.</p>
        )}
      </div>

      <div className="card">
        <h2>This week's adherence</h2>
        <p style={{ fontSize: '1.5rem', margin: 0 }}>
          {adherencePct !== null ? `${adherencePct}%` : 'No data yet'}
        </p>
        <p className="muted">
          {dashboard?.adherenceThisWeek?.takenCount ?? 0} taken, {dashboard?.adherenceThisWeek?.missedCount ?? 0} missed
        </p>
        {dashboard?.missedDoses?.length > 0 && (
          <>
            <h2 style={{ marginTop: 16 }}>Recent missed doses</h2>
            <ul>
              {dashboard.missedDoses.map((d) => (
                <li key={d.id}>
                  {d.medicationName} — {new Date(d.scheduledTime).toLocaleString()}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="card">
        <h2>Medications</h2>
        <AddMedicationForm onCreated={load} />
        {medications.map((med) => (
          <div key={med.id} style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <strong>{med.name}</strong> <span className="muted">{med.dosage} · {med.form} · stock {med.stockQuantity}</span>
            <ScheduleForm medicationId={med.id} onCreated={load} />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Caregivers</h2>
        <form className="inline" onSubmit={inviteCaregiver}>
          <input
            type="email"
            placeholder="Caregiver email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <input
            placeholder="Relationship (e.g. daughter)"
            value={inviteRelationship}
            onChange={(e) => setInviteRelationship(e.target.value)}
            required
          />
          <button type="submit">Invite</button>
        </form>
        <table>
          <thead><tr><th>Relationship</th><th>Status</th></tr></thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id}>
                <td>{link.relationship}</td>
                <td>{link.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
