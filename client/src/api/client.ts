import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexhire_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !String(error.config?.url).includes('/auth/login')) {
      localStorage.removeItem('nexhire_token');
      localStorage.removeItem('nexhire_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) return error.response?.data?.message || error.message || 'Request failed';
  return error instanceof Error ? error.message : 'Something went wrong';
}
export default client;
