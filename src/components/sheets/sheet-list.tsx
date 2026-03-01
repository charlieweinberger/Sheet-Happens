"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Sheet {
  id: string;
  name: string;
  modifiedTime: string;
}

export function SheetList() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "name-desc" | "date">("name");

  useEffect(() => {
    async function fetchSheets() {
      try {
        const response = await fetch("/api/sheets");
        if (!response.ok) {
          throw new Error("Failed to fetch sheets");
        }
        const data = await response.json();
        setSheets(data);
      } catch (err) {
        console.error("Error fetching sheets:", err);
        setError("Failed to load Google Sheets");
      } finally {
        setLoading(false);
      }
    }

    fetchSheets();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const sortedSheets = [...sheets].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name);
    } else {
      return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
    }
  });

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Event Operations
          </h1>
          <p className="text-muted-foreground text-lg">
            Select a Google Sheet to manage event logistics
          </p>
        </div>

        {!loading && sheets.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "name-desc" | "date")}
              className="border border-zinc-300 rounded-md px-3 py-1.5 text-sm bg-white hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
            >
              <option value="name">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="date">Last Edited</option>
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading Google Sheets...</p>
          </div>
        )}

        {!loading && sheets.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No Google Sheets found. Make sure the service account has access
              to at least one spreadsheet.
            </p>
          </div>
        )}

        {!loading && sheets.length > 0 && (
          <div className="grid gap-4">
            {sortedSheets.map((sheet) => (
              <Link key={sheet.id} href={`/sheet/${sheet.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">{sheet.name}</CardTitle>
                        <CardDescription className="text-base">
                          Spreadsheet ID: {sheet.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="default">Open</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Last modified: {formatDate(sheet.modifiedTime)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
