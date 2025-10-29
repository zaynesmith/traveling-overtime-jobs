export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const STATE_CODE_SET = new Set(US_STATES.map((state) => state.value));

function createNameKey(name) {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

const STATE_NAME_TO_CODE = new Map(
  US_STATES.map((state) => [createNameKey(state.label), state.value]),
);

export function normalizeStateCode(value) {
  if (value == null) return null;
  const trimmed = `${value}`.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (STATE_CODE_SET.has(upper)) {
    return upper;
  }

  const lettersOnly = upper.replace(/[^A-Z]/g, "");
  if (STATE_CODE_SET.has(lettersOnly)) {
    return lettersOnly;
  }

  const nameKey = createNameKey(trimmed);
  if (STATE_NAME_TO_CODE.has(nameKey)) {
    return STATE_NAME_TO_CODE.get(nameKey);
  }

  for (const [key, code] of STATE_NAME_TO_CODE.entries()) {
    if (key.startsWith(nameKey) || nameKey.startsWith(key)) {
      return code;
    }
  }

  return null;
}

export function getStateNameFromCode(code) {
  const normalized = normalizeStateCode(code);
  if (!normalized) return null;
  const match = US_STATES.find((state) => state.value === normalized);
  return match ? match.label : null;
}
