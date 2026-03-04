import Select, {StylesConfig} from "react-select";
import { Option }       from "@/features/promo/model/types";
import {baseSelectStyles, menuOptionStyles} from "@/shared/ui/selectStyles";

const commonSelectStyles = {
    ...baseSelectStyles,
    ...menuOptionStyles,
} as const;

const makeStyles = <T extends string>(): StylesConfig<Option<T>, false> =>
    commonSelectStyles as unknown as StylesConfig<Option<T>, false>;

const SelectOne = <T extends string>(p: {
    value: T;
    opts: Option<T>[];
    onChange: (v: T) => void;
    placeholder: string;
    disabled?: boolean;
}) => (
    <Select<Option<T>, false>
        value={p.opts.find(o => o.value === p.value)}
        options={p.opts}
        placeholder={p.placeholder}
        styles={makeStyles<T>()}
        onChange={(opt) => p.onChange(opt!.value)}
        isDisabled={p.disabled}
    />
);

export default SelectOne;