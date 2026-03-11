const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const defaultBackendUrl = (): string => {
  // If we're on localhost:3000, we're in dev mode and should connect to local backend (port 4000)
  if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    return 'http://localhost:4000';
  }

  // In all other cases (production, staging, etc.), we connect to the current origin
  // This is the most robust way to handle same-origin deployments like Railway.
  return trimTrailingSlash(window.location.origin);
};

const backendUrlFromApiUrl = (): string | null => {
  const apiUrl = process.env.REACT_APP_API_URL ? trimTrailingSlash(process.env.REACT_APP_API_URL) : null;
  if (!apiUrl) return null;
  return apiUrl.replace(/\/api$/i, '');
};

const backendUrl = process.env.REACT_APP_BACKEND_URL
  ? trimTrailingSlash(process.env.REACT_APP_BACKEND_URL)
  : (backendUrlFromApiUrl() || defaultBackendUrl());

const apiUrl = process.env.REACT_APP_API_URL
  ? trimTrailingSlash(process.env.REACT_APP_API_URL)
  : `${backendUrl}/api`;

const upgradeToHttpsIfNeeded = (url: string): string => {
  if (typeof window === 'undefined') return url;
  if (window.location.protocol !== 'https:') return url;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return url;
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  return url;
};

export const envConfig = {
  backendUrl: upgradeToHttpsIfNeeded(backendUrl),
  apiUrl: upgradeToHttpsIfNeeded(apiUrl),
  appEnv: process.env.REACT_APP_ENV || 'development',
};
