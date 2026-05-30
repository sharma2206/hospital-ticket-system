export const notificationSlice = {
    initialState: {
        messages: [],
    },
    reducers: {
        addNotification(state, payload) {
            state.messages.push(payload);
        },
    },
};
