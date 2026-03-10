const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const defaultBackendUrl = (): string => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return trimTrailingSlash(process.env.REACT_APP_BACKEND_URL);
  }

  if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    return 'http://localhost:4000';
  }

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
