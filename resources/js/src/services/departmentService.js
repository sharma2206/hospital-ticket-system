import api from './api';

export async function fetchDepartments() {
  const response = await api.get('/departments');
  return response.data;
}
