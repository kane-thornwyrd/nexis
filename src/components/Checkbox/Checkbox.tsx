import { type ChangeEvent, useId } from "react";

export type CheckboxProps = {
  disabled?: boolean;
  label: string;
  fieldcode?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

const Checkbox = ({
  checked = false,
  disabled = false,
  fieldcode,
  label,
  onChange,
}: CheckboxProps) => {
  const generatedId = useId();
  const inputId = fieldcode ?? `checkbox-${generatedId}`;
  const inputProps = onChange
    ? {
        checked,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
          onChange(event.currentTarget.checked);
        },
      }
    : {
        defaultChecked: checked,
      };

  return (
    <label htmlFor={inputId} className="rocker-switch">
      <div className="switch">
        <input
          id={inputId}
          type="checkbox"
          disabled={disabled}
          {...inputProps}
        />
        <div className="button">
          <div className="light"></div>
          <div className="dots"></div>
          <div className="characters"></div>
          <div className="shine"></div>
          <div className="shadow"></div>
        </div>
      </div>

      <span className="switch-label">{label}</span>
    </label>
  );
};

export default Checkbox;
