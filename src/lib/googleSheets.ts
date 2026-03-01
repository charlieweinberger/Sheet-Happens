import { google } from "googleapis";
import type { Participant } from "@/types";

type SheetRow = {
  timestamp?: string;
  name?: string;
  email?: string;
  phone?: string;
  discord?: string;
  rideSituation?: string;
  driverCapacity?: string;
  comments?: string;
};

function rowToParticipant(row: SheetRow, idx: number) {
  // Use email as ID for stable identification across sheet updates
  const email = row.email?.trim() || `unknown-${idx + 1}@example.com`;
  const id = email;
  
  // Parse ride situation to determine driver/rider status
  const rideSituation = row.rideSituation?.trim().toLowerCase() || "";
  let isDriver = false;
  let isSelfDriver = false;
  
  if (rideSituation.includes("provide rides")) {
    // "I have my own ride and can provide rides to others! (Thank you!!)"
    isDriver = true;
    isSelfDriver = false;
  } else if (rideSituation.includes("i have my own ride")) {
    // "I have my own ride!"
    isDriver = false;
    isSelfDriver = true;
  } else {
    // "I need a ride!" or anything else defaults to rider
    isDriver = false;
    isSelfDriver = false;
  }
  
  // Parse driver capacity - always flag for manual review if they're a driver
  let seats = 0;
  const needsManualReviewDriverCapacity = isDriver;
  if (isDriver && row.driverCapacity) {
    const capacityMatch = row.driverCapacity.match(/\d+/);
    seats = capacityMatch ? Number(capacityMatch[0]) : 0;
  }
  
  // Parse comments - flag for manual review if non-empty
  const extraComments = row.comments?.trim() || "";
  const needsManualReviewNotes = extraComments.length > 0;
  
  // For now, we don't parse preferred ride partners from comments
  // That will be handled during manual review
  const preferredRidePartners: string[] = [];

  return {
    id,
    name: row.name?.trim() || `Participant ${idx + 1}`,
    phone: row.phone?.trim() || "",
    email: email,
    timestamp: row.timestamp?.trim() || new Date().toISOString(),
    driver: isDriver,
    seats,
    selfDriver: isSelfDriver,
    extraComments,
    preferredRidePartners,
    needsManualReviewDriverCapacity,
    needsManualReviewNotes,
  } satisfies Omit<
    Participant,
    "status" | "isOfficer" | "appNotes" | "carId" | "seatIndex" | "checkInState"
  >;
}

function extractServiceAccount() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (keyJson) {
    return JSON.parse(keyJson);
  }

  if (keyPath) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(keyPath);
  }

  return null;
}

export interface GoogleSheetMetadata {
  id: string;
  name: string;
  modifiedTime: string;
}

export async function listGoogleSheets(): Promise<GoogleSheetMetadata[]> {
  const serviceAccount = extractServiceAccount();

  if (!serviceAccount) {
    return [];
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  const drive = google.drive({ version: "v3", auth });

  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      spaces: "drive",
      fields: "files(id, name, modifiedTime)",
      pageSize: 100,
    });

    const files = response.data.files ?? [];
    return files.map((file) => ({
      id: file.id || "",
      name: (file.name || "Untitled")
        .replace(/ \(responses\)$/i, "")
        .replace(/ \(Responses\)$/i, ""),
      modifiedTime: file.modifiedTime || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error listing Google Sheets:", error);
    return [];
  }
}

export async function fetchSheetParticipants(sheetId?: string) {
  const defaultSheetId = process.env.GOOGLE_SHEET_ID;
  const targetSheetId = sheetId || defaultSheetId;
  const sheetRange = process.env.GOOGLE_SHEET_RANGE ?? "Form Responses 1!A:H";
  const serviceAccount = extractServiceAccount();

  if (!targetSheetId || !serviceAccount) {
    console.warn("Missing Google Sheets credentials or sheet ID");
    return [];
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: targetSheetId,
    range: sheetRange,
  });

  const rows = response.data.values ?? [];
  if (rows.length <= 1) return [];

  const [, ...valueRows] = rows;

  const objects = valueRows.map((values) => {
    // Map the 9 columns from the Google Form:
    // 0: Timestamp
    // 1: Name
    // 2: UCI Email
    // 3: Phone Number
    // 4: Discord Handle
    // 5: Ride Situation?
    // 6: For drivers: how many passengers...
    // 7: Any questions, comments, or concerns?
    
    return {
      timestamp: String(values[0] ?? ""),
      name: String(values[1] ?? ""),
      email: String(values[2] ?? ""),
      phone: String(values[3] ?? ""),
      discord: String(values[4] ?? ""),
      rideSituation: String(values[5] ?? ""),
      driverCapacity: String(values[6] ?? ""),
      comments: String(values[7] ?? ""),
    } satisfies SheetRow;
  });

  return objects.map(rowToParticipant);
}
