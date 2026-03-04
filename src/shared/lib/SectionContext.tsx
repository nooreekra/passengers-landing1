"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Section = "agent" | "agency" | "airline";

interface SectionContextType {
    activeSection: Section;
    setActiveSection: (section: Section) => void;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export const SectionProvider = ({ children }: { children: ReactNode }) => {
    const [activeSection, setActiveSection] = useState<Section>("agent");

    return (
        <SectionContext.Provider value={{ activeSection, setActiveSection }}>
            {children}
        </SectionContext.Provider>
    );
};

export const useSection = () => {
    const context = useContext(SectionContext);
    if (!context) throw new Error("useSection must be used within SectionProvider");
    return context;
};
