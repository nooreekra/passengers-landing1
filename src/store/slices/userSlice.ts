import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {MeUser} from "@/entities/auth/types";

interface UserState {
    current: MeUser | null;
}

const initialState: UserState = {
    current: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<MeUser>) {
            state.current = action.payload;
        },
        clearUser(state) {
            state.current = null;
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
