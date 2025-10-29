import { forwardRef } from "react";
import { US_STATES, normalizeStateCode } from "@/lib/constants/states";

function getOptionLabel(state) {
  return `${state.label} (${state.value})`;
}

const StateSelect = forwardRef(function StateSelect(
  {
    name = "state",
    id = "state",
    value,
    onChange,
    onBlur,
    className = "form-input",
    placeholder = "Select state",
    includePlaceholder = true,
    disabled = false,
    ...props
  },
  ref,
) {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  const normalizedCode = normalizeStateCode(normalizedValue) || normalizedValue || "";
  const hasCustomOption =
    normalizedCode && !US_STATES.some((state) => state.value === normalizedCode);

  return (
    <select
      ref={ref}
      id={id}
      name={name}
      value={normalizedCode || ""}
      onChange={onChange}
      onBlur={onBlur}
      className={className}
      disabled={disabled}
      {...props}
    >
      {includePlaceholder ? (
        <option value="" disabled={props.required}>{placeholder}</option>
      ) : null}
      {hasCustomOption ? (
        <option value={normalizedCode}>{normalizedValue}</option>
      ) : null}
      {US_STATES.map((state) => (
        <option key={state.value} value={state.value}>
          {getOptionLabel(state)}
        </option>
      ))}
    </select>
  );
});

export default StateSelect;
