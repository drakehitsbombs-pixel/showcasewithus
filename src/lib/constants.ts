// Photography style options - source of truth for the entire app
export const STYLE_OPTIONS = [
  { id: "wedding", label: "Wedding" },
  { id: "portrait", label: "Portrait" },
  { id: "product", label: "Product" },
  { id: "event", label: "Event" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "editorial", label: "Editorial" },
  { id: "real_estate", label: "Real Estate" }, // DB value stays real_estate for backwards compatibility
  { id: "food", label: "Food" },
  { id: "sports", label: "Sports" },
  { id: "surfing", label: "Surfing" },
  { id: "commercial", label: "Commercial" },
] as const;

// Helper to get label from id
export const getStyleLabel = (id: string): string => {
  const style = STYLE_OPTIONS.find(s => s.id === id);
  return style?.label || id;
};

// Helper to get all style IDs
export const getAllStyleIds = (): string[] => {
  return STYLE_OPTIONS.map(s => s.id);
};

// Helper to validate style ID
export const isValidStyleId = (id: string): boolean => {
  return STYLE_OPTIONS.some(s => s.id === id);
};
