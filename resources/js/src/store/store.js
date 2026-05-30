import { authSlice } from "./authSlice";
import { ticketSlice } from "./ticketSlice";
import { notificationSlice } from "./notificationSlice";

export const store = {
    auth: authSlice.initialState,
    tickets: ticketSlice.initialState,
    notifications: notificationSlice.initialState,
    reducers: {
        auth: authSlice.reducers,
        tickets: ticketSlice.reducers,
        notifications: notificationSlice.reducers,
    },
};
