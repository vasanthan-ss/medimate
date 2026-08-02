import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

function StatusPill({ status }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}

export default function CaregiverDashboard() {
  const [links, setLinks] = useState([]);
  const [patientDashboards, setPatientDashboards] = useState({});
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [error, setError] = useState(null);
  const [busyEscalationId, setBusyEscalationId] = useState(null);
  const [busyLinkId, setBusyLinkId] = useState(null);

  const loadLinksAndDashboards = useCallback(async () => {
    try {
      const linksRes = await api.get('/links');
      setLinks(linksRes.data);

      const activeLinks = linksRes.data.filter((l) => l.status === 'ACTIVE');
      const entries = await Promise.all(
        activeLinks.map(async (l) => {
          const dash = await api.get(`/patients/${l.patientId}/dashboard`);
          return [l.patientId, dash];
        })
      );
      const map = Object.fromEntries(entries);
      setPatientDashboards(map);
      setSelectedPatientId((prev) => prev || activeLinks[0]?.patientId || null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadEscalations = useCallback(async () => {
    try {
      const res = await api.get('/escalations?acknowledged=false');
      setEscalations(res.data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadLinksAndDashboards();
    loadEscalations();
  }, [loadLinksAndDashboards, loadEscalations]);

  async function acceptLink(linkId) {
    setBusyLinkId(linkId);
    try {
      await api.post(`/links/${linkId}/accept`);
      await loadLinksAndDashboards();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyLinkId(null);
    }
  }

  async function acknowledgeEscalation(id) {
    setBusyEscalationId(id);
    try {
      await api.post(`/escalations/${id}/acknowledge`);
      await loadEscalations();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyEscalationId(null);
    }
  }

  const pendingLinks = links.filter((l) => l.status === 'PENDING');
  const activeLinks = links.filter((l) => l.status === 'ACTIVE');
  const selectedDashboard = selectedPatientId ? patientDashboards[selectedPatientId] : null;

  return (
    <div>
      <h1>Caregiver dashboard</h1>
      {error && <div className="error-banner">{error}</div>}

      {pendingLinks.length > 0 && (
        <div className="card">
          <h2>Pending invites</h2>
          {pendingLinks.map((l) => (
            <div key={l.id} style={{ marginBottom: 8 }}>
              Invite from a patient ({l.relationship}) —{' '}
              <button onClick={() => acceptLink(l.id)} disabled={busyLinkId === l.id}>
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Escalations needing attention</h2>
        {escalations.length === 0 && <p className="muted">Nothing pending — all clear.</p>}
        {escalations.length > 0 && (
          <table>
            <thead>
              <tr><th>Patient</th><th>Medication</th><th>Due</th><th>Tier</th><th></th></tr>
            </thead>
            <tbody>
              {escalations.map((esc) => (
                <tr key={esc.id}>
                  <td>{esc.patientName}</td>
                  <td>{esc.medicationName}</td>
                  <td>{new Date(esc.scheduledTime).toLocaleString()}</td>
                  <td>{esc.tier}</td>
                  <td>
                    <button onClick={() => acknowledgeEscalation(esc.id)} disabled={busyEscalationId === esc.id}>
                      Acknowledge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Your patients</h2>
        {activeLinks.length === 0 && <p className="muted">No linked patients yet.</p>}
        <div className="patient-list">
          {activeLinks.map((l) => (
            <div
              key={l.id}
              className={`patient-chip ${selectedPatientId === l.patientId ? 'active' : ''}`}
              onClick={() => setSelectedPatientId(l.patientId)}
            >
              {patientDashboards[l.patientId]?.patientName || '...'}
            </div>
          ))}
        </div>

        {selectedDashboard && (
          <>
            <h2>{selectedDashboard.patientName} — today</h2>
            {selectedDashboard.today.length === 0 && <p className="muted">Nothing scheduled today.</p>}
            {selectedDashboard.today.length > 0 && (
              <table>
                <thead><tr><th>Medication</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {selectedDashboard.today.map((log) => (
                    <tr key={log.id}>
                      <td>{log.medicationName}</td>
                      <td>{new Date(log.scheduledTime).toLocaleTimeString()}</td>
                      <td><StatusPill status={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p style={{ marginTop: 16 }}>
              This week's adherence:{' '}
              <strong>
                {selectedDashboard.adherenceThisWeek.adherenceRate != null
                  ? `${Math.round(selectedDashboard.adherenceThisWeek.adherenceRate * 100)}%`
                  : 'No data yet'}
              </strong>{' '}
              <span className="muted">
                ({selectedDashboard.adherenceThisWeek.takenCount} taken, {selectedDashboard.adherenceThisWeek.missedCount} missed)
              </span>
            </p>

            {selectedDashboard.missedDoses.length > 0 && (
              <>
                <h2>Recent missed doses</h2>
                <ul>
                  {selectedDashboard.missedDoses.map((d) => (
                    <li key={d.id}>
                      {d.medicationName} — {new Date(d.scheduledTime).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
