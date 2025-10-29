export function formatZipSuggestionMessage(suggestion) {
  if (!suggestion || !suggestion.zip) {
    return "We couldn’t find that ZIP. Please double-check or enter one from your area.";
  }

  const location = [suggestion.city, suggestion.state].filter(Boolean).join(", ");
  if (location) {
    return `That ZIP was unrecognized. Try using ${suggestion.zip} from ${location} instead.`;
  }
  return `That ZIP was unrecognized. Try using ${suggestion.zip} instead.`;
}

export function formatZipSuggestionLocation(suggestion) {
  if (!suggestion) return "";
  return [suggestion.city, suggestion.state].filter(Boolean).join(", ");
}
