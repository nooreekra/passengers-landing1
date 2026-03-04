import { StylesConfig } from "react-select";
import { CSSObjectWithLabel, OptionProps } from "react-select";

type Option = { value: string; label: string }

export const baseSelectStyles: StylesConfig<Option, boolean> = {
    control: (base, state) => ({
        ...base,
        minHeight: "44px",
        padding: "8px 16px",
        borderRadius: "0.75rem",
        borderColor: state.isFocused ? "#2563EB" : "#E5E7EB",
        boxShadow: "none",
        ":hover": { borderColor: state.isFocused ? "#2563EB" : "#D1D5DB" }
    }),
    placeholder: base => ({
        ...base,
        fontSize: "14px",
        color: "#9CA3AF"
    }),
    valueContainer: base => ({ ...base, padding: 0 }),
    indicatorsContainer: base => ({ ...base, paddingRight: "0.5rem" })
};

export const menuOptionStyles = {
    option: (
        base: CSSObjectWithLabel,
        state: OptionProps<Option, boolean>
    ): CSSObjectWithLabel => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#2563EB22"
            : state.isFocused
                ? "#F3F4F6"
                : undefined,
        color: "#111827"
    })
};
