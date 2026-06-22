import axios from 'axios';

const AUTH_TOKEN_KEY = 'sige_auth_token';
const SESSION_EXPIRED_EVENT = 'sige:session-expired';

export const api = axios.create({
  baseURL: '/api',
});

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getAuthToken()) {
      clearAuthToken();
      localStorage.removeItem('sige_admin_session');
      localStorage.removeItem('sige_portal_session');
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);
