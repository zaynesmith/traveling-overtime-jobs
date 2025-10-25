const TRADE_ALIASES = {
  Electrician: ["Electrician", "Electrician (Inside Wireman)"],
  Lineman: ["Lineman", "Electrician (Outside Lineman)"],
};

const NORMALIZATION_LOOKUP = new Map();
Object.entries(TRADE_ALIASES).forEach(([normalized, aliases]) => {
  aliases.forEach((alias) => {
    NORMALIZATION_LOOKUP.set(alias.trim().toLowerCase(), normalized);
  });
});

export function normalizeTrade(value) {
  if (!value) return value;
  const trimmed = value.toString().trim();
  const normalized = NORMALIZATION_LOOKUP.get(trimmed.toLowerCase());
  return normalized || trimmed;
}

export function getTradeSynonyms(value) {
  if (!value) return [];
  const normalized = normalizeTrade(value);
  const aliases = TRADE_ALIASES[normalized];
  if (!aliases) {
    return [normalized];
  }

  const variants = new Set(
    aliases.map((alias) => alias.trim()).concat(normalized)
  );

  return Array.from(variants);
}

export const TRADES = [
  "Electrician",
  "Lineman",
  "Pipefitter",
  "Welder",
  "Millwright",
  "Carpenter",
  "HVAC Technician",
  "Ironworker",
  "Heavy Equipment Operator",
  "Sheet Metal Worker",
  "Plumber",
  "Boilermaker",
  "Crane Operator",
  "Instrumentation Technician",
  "Insulator",
  "Rigger",
  "Scaffold Builder",
  "Concrete Finisher",
  "Mason / Bricklayer",
  "Painter / Sandblaster",
  "Laborer",
];

export { TRADE_ALIASES };

export default TRADES;
