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

const backendUrl = defaultBackendUrl();

const apiUrl = process.env.REACT_APP_API_URL
  ? trimTrailingSlash(process.env.REACT_APP_API_URL)
  : `${backendUrl}/api`;

export const envConfig = {
  backendUrl,
  apiUrl,
  appEnv: process.env.REACT_APP_ENV || 'development',
};
