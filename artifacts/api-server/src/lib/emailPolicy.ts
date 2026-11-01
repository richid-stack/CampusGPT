/** Parse a comma-separated list of allowed email domains (e.g. "st.ug.edu.gh"). */
export function parseAllowedDomains(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

/**
 * True if the address belongs to an allowed domain. An empty allow-list means
 * "no restriction" (handy for local development). Matching is exact on the
 * part after the last "@", so "evil-st.ug.edu.gh" or "st.ug.edu.gh.evil.com"
 * never match "st.ug.edu.gh".
 */
export function isAllowedEmail(email: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return allowed.includes(domain);
}
