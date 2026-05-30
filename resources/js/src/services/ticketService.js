import api from './api';

export async function fetchTickets() {
  const response = await api.get('/tickets');
  return response.data;
}

export async function createTicket(payload) {
  const response = await api.post('/tickets', payload);
  return response.data;
}
