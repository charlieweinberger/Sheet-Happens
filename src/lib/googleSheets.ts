import { google } from "googleapis";
import { mockSheetParticipants } from "@/lib/mockData";
import type { Participant } from "@/types";

type SheetRow = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  timestamp?: string;
  driver?: string;
  seats?: string;
  riderPreferences?: string;
  notes?: string;
  preferredRidePartners?: string;
};

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "yes", "1", "y"].includes(value.toLowerCase().trim());
}

function rowToParticipant(row: SheetRow, idx: number) {
  const id = row.id?.trim() || `${idx + 1}`;
  const preferredPartnersStr = row.preferredRidePartners?.trim() || "";
  const preferredRidePartners: string[] = preferredPartnersStr 
    ? preferredPartnersStr.split(",").map(s => s.trim()).filter(Boolean)
    : [];
  
  return {
    id,
    name: row.name?.trim() || `Participant ${id}`,
    phone: row.phone?.trim() || "",
    email: row.email?.trim() || `unknown-${id}@example.com`,
    timestamp: row.timestamp?.trim() || new Date().toISOString(),
    driver: parseBool(row.driver),
    seats: Number(row.seats || 0) || 0,
    riderPreferences: row.riderPreferences?.trim() || "",
    sourceNotes: row.notes?.trim() || "",
    preferredRidePartners: preferredRidePartners || [],
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

export async function fetchSheetParticipants() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetRange = process.env.GOOGLE_SHEET_RANGE ?? "Form Responses 1!A:I";
  const serviceAccount = extractServiceAccount();

  if (!sheetId || !serviceAccount) {
    return mockSheetParticipants;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: sheetRange,
  });

  const rows = response.data.values ?? [];
  if (rows.length <= 1) return mockSheetParticipants;

  const [headerRow, ...valueRows] = rows;
  const headers = headerRow.map((h) => String(h).trim());

  const objects = valueRows.map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = String(values[i] ?? "");
    });

    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      timestamp: row.timestamp,
      driver: row.driver,
      seats: row.seats,
      riderPreferences: row.riderPreferences,
      notes: row.notes,
      preferredRidePartners: row.preferredRidePartners,
    } satisfies SheetRow;
  });

  return objects.map(rowToParticipant);
}
