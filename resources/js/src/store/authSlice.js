export const authSlice = {
    initialState: {
        user: null,
        token: null,
        isAuthenticated: false,
    },
    reducers: {
        login(state, payload) {
            state.user = payload.user;
            state.token = payload.token;
            state.isAuthenticated = true;
        },
        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
    },
};
