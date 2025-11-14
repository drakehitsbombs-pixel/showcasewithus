/**
 * Capitalizes email local part (before @) into a display name
 * Example: "drake.phillips@gmail.com" → "Drake Phillips"
 */
export function capitalizeEmailLocalPart(email: string | null | undefined): string {
  if (!email) return "";
  
  const localPart = email.split("@")[0];
  if (!localPart) return "";
  
  // Replace common separators with spaces
  const normalized = localPart.replace(/[._-]+/g, " ");
  
  // Capitalize each word
  return normalized
    .split(" ")
    .map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : "")
    .join(" ")
    .trim();
}

/**
 * Generates a public display name for a photographer profile
 * Priority:
 * 1. If show_name_public is false → "Photographer"
 * 2. User name (from users_extended)
 * 3. Capitalized email local part
 * 4. "Photographer" (fallback)
 */
export function getPublicDisplayName(
  userName: string | null | undefined,
  userEmail: string | null | undefined,
  showNamePublic: boolean = true
): string {
  // If privacy is enabled, hide name
  if (showNamePublic === false) {
    return "Photographer";
  }

  // Try user name first
  const trimmedName = (userName || "").trim();
  if (trimmedName) {
    return trimmedName;
  }

  // Try capitalizing email
  const emailName = capitalizeEmailLocalPart(userEmail);
  if (emailName) {
    return emailName;
  }

  // Final fallback
  return "Photographer";
}
