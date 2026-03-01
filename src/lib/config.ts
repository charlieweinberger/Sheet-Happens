// Predefined list of officer email addresses
export const OFFICER_EMAILS: Set<string> = new Set([
  // Add officer emails here
  "ccweinbe@uci.edu",
  "gdodge@uci.edu",
  "sokraksh@uci.edu",
  "mkuhi@uci.edu",
  "dkaloust@uci.edu",
  "ostdieke@uci.edu",
  "lobatonl@uci.edu",
  "nalara1@uci.edu"
]);

export function isOfficerEmail(email: string): boolean {
  return OFFICER_EMAILS.has(email.toLowerCase());
}
