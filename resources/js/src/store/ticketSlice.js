export const ticketSlice = {
  initialState: {
    tickets: [],
    selectedTicket: null,
    loading: false,
  },
  reducers: {
    setTickets(state, payload) {
      state.tickets = payload;
    },
    setSelectedTicket(state, payload) {
      state.selectedTicket = payload;
    },
  },
};
