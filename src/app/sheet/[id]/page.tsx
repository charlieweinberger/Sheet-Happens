import { OperationsStudio } from "@/components/operations-studio";
import { getEventData } from "@/lib/eventStore";

export const dynamic = "force-dynamic";

export default async function SheetPage({
  params,
}: {
  params: { id: string };
}) {
  // For now, we ignore the sheet ID and just load the mock data
  // In the future, we'll use the ID to fetch data from Google Sheets
  const data = await getEventData();
  
  // Hardcoded sheet name for now - will come from Google Sheets API later
  const sheetName = "IrvineHacks 2026 Event Data";
  
  return <OperationsStudio initialData={data} sheetName={sheetName} />;
}
