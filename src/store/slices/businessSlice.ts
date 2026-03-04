import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {Business} from "@/entities/business/types";

interface BusinessState {
    current: Business | null;
}

const initialState: BusinessState = {
    current: null,
};

const businessSlice = createSlice({
    name: "business",
    initialState,
    reducers: {
        setBusiness(state, action: PayloadAction<Business>) {
            state.current = action.payload;
        },
        clearBusiness(state) {
            state.current = null;
        },
    },
});

export const { setBusiness, clearBusiness } = businessSlice.actions;
export default businessSlice.reducer;
