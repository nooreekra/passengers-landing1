"use client";

import { Provider } from "react-redux";
import { store, persistor } from "@/store";
import { PersistGate } from "redux-persist/integration/react";
import { SectionProvider } from "@/shared/lib/SectionContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/shared/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <SectionProvider>
                    {children}
                    <ToastContainer position="top-right" autoClose={3000} />
                </SectionProvider>
            </PersistGate>
        </Provider>
    );
}
