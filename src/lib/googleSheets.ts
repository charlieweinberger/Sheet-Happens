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
  const rideSituation = row.rideSituation?.trim() || "";
  const rideSituationLower = rideSituation.toLowerCase();
  let isDriver = false;
  let isSelfDriver = false;
  
  // Check for driver first (can drive others)
  if (rideSituationLower.includes("can drive")) {
    // "I have my own ride and can drive others (thank you!!)"
    isDriver = true;
    isSelfDriver = false;
    console.log(`✓ ${row.name} is a DRIVER`);
  } 
  // Then check for self-driver (has own ride but not driving others)
  else if (rideSituationLower.includes("have my own ride")) {
    // "I have my own ride!"
    isDriver = false;
    isSelfDriver = true;
    console.log(`✓ ${row.name} is a SELF-DRIVER`);
  } 
  // Default to rider (needs a ride)
  else {
    // "I need a ride!" or anything else defaults to rider
    isDriver = false;
    isSelfDriver = false;
    console.log(`✓ ${row.name} is a RIDER`);
  }
  
  // Parse driver capacity - always flag for manual review if they're a driver
  let seats = 0;
  const needsManualReviewDriverCapacity = isDriver;
  if (isDriver) {
    console.log(`  Driver capacity field for ${row.name}:`, JSON.stringify(row.driverCapacity));
    if (row.driverCapacity) {
      const capacityLower = row.driverCapacity.toLowerCase();
      
      // Map text numbers to digits
      const textToNumber: Record<string, number> = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      
      // First try to find a digit
      const digitMatch = row.driverCapacity.match(/\d+/);
      if (digitMatch) {
        seats = Number(digitMatch[0]);
      } else {
        // Try to find text numbers
        for (const [text, num] of Object.entries(textToNumber)) {
          if (capacityLower.includes(text)) {
            seats = num;
            break;
          }
        }
      }
      
      console.log(`  Parsed seats: ${seats}`);
    }
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
    "status" | "isOfficer" | "isPaidMember" | "appNotes" | "carId" | "seatIndex" | "checkInState" | "driverCapacityReviewApproved" | "notesReviewApproved"
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
  const sheetRange = "Form Responses 1";
  const serviceAccount = extractServiceAccount();

  if (!serviceAccount) {
    console.warn("Missing Google Sheets service account credentials");
    return [];
  }

  if (!targetSheetId) {
    console.warn("No sheet ID provided - please select a sheet from the home page");
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

  const [headerRow, ...valueRows] = rows;

  // Define the expected column titles
  const columnTitles = {
    timestamp: "Timestamp",
    name: "Name",
    email: "UCI Email",
    phone: "Phone Number",
    discord: "Discord Handle (optional)",
    rideSituation: "Ride situation?",
    driverCapacity: "For drivers: how many people can you take?",
    comments: "Questions, comments, or concerns?",
  };

  // Find the index of each column by searching for the header title
  const columnIndices: Record<keyof typeof columnTitles, number> = {
    timestamp: -1,
    name: -1,
    email: -1,
    phone: -1,
    discord: -1,
    rideSituation: -1,
    driverCapacity: -1,
    comments: -1,
  };

  // Search for each column title in the header row
  for (const [key, title] of Object.entries(columnTitles)) {
    const index = headerRow.findIndex(
      (header) => header?.trim().toLowerCase() === title.toLowerCase()
    );
    if (index !== -1) {
      columnIndices[key as keyof typeof columnTitles] = index;
    } else {
      console.warn(`Column "${title}" not found in sheet headers`);
    }
  }

  const objects = valueRows.map((values) => {
    return {
      timestamp: columnIndices.timestamp !== -1 ? String(values[columnIndices.timestamp] ?? "") : "",
      name: columnIndices.name !== -1 ? String(values[columnIndices.name] ?? "") : "",
      email: columnIndices.email !== -1 ? String(values[columnIndices.email] ?? "") : "",
      phone: columnIndices.phone !== -1 ? String(values[columnIndices.phone] ?? "") : "",
      discord: columnIndices.discord !== -1 ? String(values[columnIndices.discord] ?? "") : "",
      rideSituation: columnIndices.rideSituation !== -1 ? String(values[columnIndices.rideSituation] ?? "") : "",
      driverCapacity: columnIndices.driverCapacity !== -1 ? String(values[columnIndices.driverCapacity] ?? "") : "",
      comments: columnIndices.comments !== -1 ? String(values[columnIndices.comments] ?? "") : "",
    } satisfies SheetRow;
  });

  return objects.map(rowToParticipant);
}
