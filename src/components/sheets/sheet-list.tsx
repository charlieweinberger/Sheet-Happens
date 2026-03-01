"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Sheet {
  id: string;
  name: string;
  description: string;
  lastModified: string;
}

export function SheetList() {
  // For now, we'll hardcode one sheet
  // In the future, this will come from the Google Sheets API
  const sheets: Sheet[] = [
    {
      id: "demo-sheet",
      name: "IrvineHacks 2026 Event Data",
      description: "Carpool and participant management for IrvineHacks 2026",
      lastModified: "February 28, 2026",
    },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Event Operations</h1>
          <p className="text-muted-foreground text-lg">
            Select a Google Sheet to manage event logistics
          </p>
        </div>

        <div className="grid gap-4">
          {sheets.map((sheet) => (
            <Link key={sheet.id} href={`/sheet/${sheet.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">{sheet.name}</CardTitle>
                      <CardDescription className="text-base">
                        {sheet.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="default">Open</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Last modified: {sheet.lastModified}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            More sheets will be available here once Google Sheets API integration is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
