// Photography style options - source of truth for the entire app
export const STYLE_OPTIONS = [
  { id: "wedding", label: "Wedding" },
  { id: "portrait", label: "Portrait" },
  { id: "product", label: "Product" },
  { id: "event", label: "Event" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "editorial", label: "Editorial" },
  { id: "real_estate", label: "Real Estate" },
  { id: "food", label: "Food" },
  { id: "sports", label: "Sports" },
  { id: "surfing", label: "Surfing" },
  { id: "graduation", label: "Graduation" },
  { id: "commercial", label: "Commercial" },
] as const;

// Valid style IDs for validation
export const STYLE_IDS = STYLE_OPTIONS.map(s => s.id);

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

// Helper to check if profile has surfing style
export const hasSurfing = (styles: string[] | null | undefined): boolean => {
  return styles?.includes("surfing") || false;
};
