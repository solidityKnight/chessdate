import axios from 'axios';
import { envConfig } from '../config/env';
import { tokenStorage } from './tokenStorage';
import { useGameStore } from '../store/gameStore';

const api = axios.create({
  baseURL: envConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    const token = tokenStorage.get() || useGameStore.getState().token;
    if (!isAuthEndpoint && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const isNetwork = error?.message === 'Network Error' || error?.code === 'ERR_NETWORK';
    if (!config || !isNetwork || config.__chessdateRetried) {
      return Promise.reject(error);
    }

    const url = config.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me');
    if (!isAuthEndpoint) {
      return Promise.reject(error);
    }

    const sameOriginApi = `${window.location.origin}/api`;
    if (config.baseURL === sameOriginApi) {
      return Promise.reject(error);
    }

    config.__chessdateRetried = true;
    config.baseURL = sameOriginApi;
    return api.request(config);
  }
);

export const getAuthHeaders = () => {
  const token = tokenStorage.get() || useGameStore.getState().token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export default api;
