import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PATIENT',
    phone: '',
    timezone: 'Asia/Kolkata',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.phone) delete payload.phone;
      const user = await register(payload);
      navigate(user.role === 'CAREGIVER' ? '/caregiver' : '/patient');
    } catch (err) {
      setError(err.body?.details?.fieldErrors ? JSON.stringify(err.body.details.fieldErrors) : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page card">
      <h1>Register</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Name</label>
          <br />
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password (min 8 chars)</label>
          <br />
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
            minLength={8}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Phone (for SMS reminders)</label>
          <br />
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+15005550006" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>I am a...</label>
          <br />
          <select value={form.role} onChange={(e) => update('role', e.target.value)} style={{ width: '100%' }}>
            <option value="PATIENT">Patient</option>
            <option value="CAREGIVER">Caregiver</option>
          </select>
        </div>
        <button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
