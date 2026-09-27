import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

client.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.access_token) {
      config.headers.Authorization = `Bearer ${user.access_token}`;
    }
  } catch {
    // localStorage parse failure — proceed without token
  }
  return config;
});

export default client;

