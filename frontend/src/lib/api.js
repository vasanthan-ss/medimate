const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

function getTokens() {
  return {
    accessToken: localStorage.getItem('medimate_access_token'),
    refreshToken: localStorage.getItem('medimate_refresh_token'),
  };
}

function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('medimate_access_token', accessToken);
  if (refreshToken) localStorage.setItem('medimate_refresh_token', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('medimate_access_token');
  localStorage.removeItem('medimate_refresh_token');
  localStorage.removeItem('medimate_user');
}

class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new ApiError(401, { error: 'Not authenticated' });

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    throw new ApiError(401, { error: 'Session expired' });
  }
  const data = await res.json();
  setTokens(data);
  return data.accessToken;
}

async function request(path, { method = 'GET', body, skipAuth = false, isRetry = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (!skipAuth) {
    const { accessToken } = getTokens();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuth && !isRetry) {
    try {
      await refreshAccessToken();
      return request(path, { method, body, skipAuth, isRetry: true });
    } catch {
      clearTokens();
      window.location.href = '/login';
      throw new ApiError(401, { error: 'Session expired' });
    }
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export { getTokens, setTokens, clearTokens, ApiError, BASE_URL };
