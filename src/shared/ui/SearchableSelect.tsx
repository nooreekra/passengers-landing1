import React from "react";
import Select, { StylesConfig } from "react-select";
import { baseSelectStyles, menuOptionStyles } from "@/shared/ui/selectStyles";

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}

const makeStyles = (): StylesConfig<Option, false> => {
    const baseControl = baseSelectStyles.control;
    
    return {
        ...baseSelectStyles,
        ...menuOptionStyles,
        control: (base, state) => {
            const baseStyles = typeof baseControl === 'function' 
                ? baseControl(base, state) 
                : base;
            return {
                ...baseStyles,
                borderRadius: "0.75rem",
                borderColor: state.isFocused ? "#0062E4" : "#D1D5DB",
                boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 98, 228, 0.1)" : "none",
                ":hover": {
                    borderColor: state.isFocused ? "#0062E4" : "#D1D5DB",
                },
            };
        },
        input: (base) => ({
            ...base,
            margin: 0,
            padding: 0,
        }),
        singleValue: (base) => ({
            ...base,
            color: "#111827",
        }),
    } as StylesConfig<Option, false>;
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    value,
    options,
    onChange,
    placeholder = "Select...",
    disabled = false,
    required = false,
}) => {
    const selectedOption = options.find((opt) => opt.value === value) || null;

    return (
        <Select<Option, false>
            value={selectedOption}
            options={options}
            onChange={(opt) => onChange(opt?.value || "")}
            placeholder={placeholder}
            styles={makeStyles()}
            isDisabled={disabled}
            isSearchable={true}
            isClearable={!required}
            classNamePrefix="react-select"
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            maxMenuHeight={200}
        />
    );
};

export default SearchableSelect;

