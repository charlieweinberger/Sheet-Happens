// Predefined list of officer email addresses
export const OFFICER_EMAILS: Set<string> = new Set([
  // Add officer emails here
  "lobatonl@uci.edu",
  "dkaloust@uci.edu",
  "nalara1@uci.edu",
  "sokraksh@uci.edu",
  "gdodge@uci.edu",
  "ccweinbe@uci.edu",
  "mkuhi@uci.edu",
  "ostdieke@uci.edu",
  "henkkab@uci.edu",
  "wharring@uci.edu",
  "kaylamk2@uci.edu",
  "sbarsan@uci.edu",
  "lokeshs1@uci.edu",
  "woodburp@uci.edu",
]);

export function isOfficerEmail(email: string): boolean {
  return OFFICER_EMAILS.has(email.toLowerCase());
}
