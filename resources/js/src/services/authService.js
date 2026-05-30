import api from './api';

export async function login(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}

export async function register(data) {
  const response = await api.post('/auth/register', data);
  return response.data;
}
