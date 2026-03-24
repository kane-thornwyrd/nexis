import { useId } from "react";

import { useRadioGroupContext } from "./RadioGroup";

export type RadioProps = {
  checked?: boolean;
  description?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  name?: string;
  onCheckedChange?: (checked: boolean) => void;
  value: string;
};

export function Radio({
  checked,
  description,
  disabled = false,
  id,
  label,
  name,
  onCheckedChange,
  value,
}: RadioProps) {
  const group = useRadioGroupContext();
  const generatedId = useId();
  const inputId = id ?? `radio-${generatedId}`;
  const inputName = name ?? group?.name;
  const isDisabled = disabled || group?.disabled || false;
  const isChecked = group ? group.selectedValue === value : checked;

  return (
    <label
      className="radio-option"
      data-disabled={isDisabled ? "true" : "false"}
      htmlFor={inputId}
    >
      <input
        id={inputId}
        className="radio-option__input"
        type="radio"
        name={inputName}
        value={value}
        disabled={isDisabled}
        checked={isChecked}
        onChange={(event) => {
          if (event.currentTarget.checked) {
            group?.onSelect(value);
          }

          onCheckedChange?.(event.currentTarget.checked);
        }}
      />

      <span className="radio-option__control" aria-hidden="true">
        <span className="radio-option__dot" />
      </span>

      <span className="radio-option__copy">
        <span className="radio-option__label">{label}</span>
        {description ? (
          <span className="radio-option__description">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
