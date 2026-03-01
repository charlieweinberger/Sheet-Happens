import { listGoogleSheets } from "@/lib/googleSheets";

export async function GET() {
  try {
    const sheets = await listGoogleSheets();
    return Response.json(sheets);
  } catch (error) {
    console.error("Error fetching sheets:", error);
    return Response.json(
      { error: "Failed to fetch sheets" },
      { status: 500 }
    );
  }
}
