import { OperationsStudio } from "@/components/operations-studio";
import { getEventData } from "@/lib/eventStore";
import { listGoogleSheets } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function SheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sheetId } = await params;
  
  // Fetch data from the selected Google Sheet
  const data = await getEventData(sheetId);
  
  // Get the sheet name from the available sheets list
  const sheets = await listGoogleSheets();
  const sheet = sheets.find(s => s.id === sheetId);
  const sheetName = sheet?.name || "Unknown Sheet";
  
  return <OperationsStudio initialData={data} sheetName={sheetName} />;
}
