import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";

type RadioGroupContextValue = {
  disabled: boolean;
  name: string;
  onSelect: (nextValue: string) => void;
  selectedValue: string;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export const useRadioGroupContext = () => useContext(RadioGroupContext);

export type RadioGroupProps = {
  children: ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  legend?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

export function RadioGroup({
  children,
  defaultValue = "",
  disabled = false,
  legend,
  name,
  onValueChange,
  value,
}: RadioGroupProps) {
  const generatedName = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const groupName = name ?? `radio-group-${generatedName}`;

  const onSelect = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <RadioGroupContext.Provider
      value={{
        disabled,
        name: groupName,
        onSelect,
        selectedValue,
      }}
    >
      <fieldset className="radio-group" disabled={disabled}>
        {legend ? (
          <legend className="radio-group__legend">{legend}</legend>
        ) : null}
        <div className="radio-group__items">{children}</div>
      </fieldset>
    </RadioGroupContext.Provider>
  );
}
