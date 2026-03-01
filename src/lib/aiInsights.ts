import type { Insight, Participant, EventStatus } from "@/types";

export interface VoiceCommand {
  type: "driver_status" | "seat_capacity" | "move_rider" | "set_status";
  participantId?: string;
  participantName?: string;
  newDriverStatus?: boolean;
  newSelfDriverStatus?: boolean;
  newSeats?: number;
  targetCarId?: string;
  targetDriverName?: string;
  newEventStatus?: EventStatus;
  confidence: number;
  rawInput: string;
  interpretation: string;
  ambiguities?: string[];
}

export interface CommandExecutionResult {
  success: boolean;
  message: string;
  participantId?: string;
  changes?: Record<string, unknown>;
  error?: string;
}

/**
 * Parse voice input into structured carpool commands
 * Handles: driver status, seat capacity, moving riders, setting event status
 */
export function parseVoiceCommand(
  voiceInput: string,
  participants: Participant[],
): VoiceCommand {
  const input = voiceInput.toLowerCase().trim();
  const ambiguities: string[] = [];

  // Helper: Find participant by name (fuzzy matching)
  const findParticipant = (name: string): Participant | undefined => {
    const cleanName = name.toLowerCase().trim();
    const exact = participants.find(
      (p) => p.name.toLowerCase() === cleanName,
    );
    if (exact) return exact;

    // Fuzzy: first or last name match
    const fuzzy = participants.filter((p) => {
      const nameParts = p.name.toLowerCase().split(" ");
      return nameParts.some((part) => part.includes(cleanName) || cleanName.includes(part));
    });

    if (fuzzy.length === 1) return fuzzy[0];
    if (fuzzy.length > 1) {
      ambiguities.push(`Found ${fuzzy.length} matches for "${name}": ${fuzzy.map((p) => p.name).join(", ")}`);
      return fuzzy[0]; // Return first match with warning
    }

    return undefined;
  };

  // Command patterns
  const patterns = {
    // Driver status: "make Alex a driver", "make Alex a self-driver", "make Alex a rider"
    driverStatus: /(?:make|convert|change)\s+(.+?)\s+(?:a|to)\s+(driver|self-driver|rider|passenger)/i,
    // Seat capacity: "Alex has 4 seats", "give Alex 6 seats", "Alex with 5 seats"
    seatCapacity: /(?:(.+?)\s+(?:has|with|needs?|get)\s+(\d)\s+seats?|give\s+(.+?)\s+(\d)\s+seats?)/i,
    // Move rider: "move Alex to John's car", "put Alex in John's car", "assign Alex to John"
    moveRider: /(?:move|put|assign)\s+(.+?)\s+(?:to|in|with)\s+(.+?)(?:'s)?\s+car/i,
    // Set status: "confirm Alex", "mark Alex as present", "Alex is confirmed", "cancel Maria"
    setStatus: /(?:confirm|mark\s+(.+?)\s+as|(.+?)\s+is\s+)(confirmed|present|cancelled|awaiting|ambiguous|text_sent)/i,
  };

  // Try driver status pattern
  let match = patterns.driverStatus.exec(input);
  if (match) {
    const name = match[1].trim();
    const status = match[2].toLowerCase();
    const participant = findParticipant(name);

    if (!participant) {
      return {
        type: "driver_status",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Could not find participant "${name}"`,
        ambiguities: ambiguities,
      };
    }

    const newDriverStatus = status !== "rider" && status !== "passenger";
    const newSelfDriverStatus = status === "self-driver";

    return {
      type: "driver_status",
      participantId: participant.id,
      participantName: participant.name,
      newDriverStatus,
      newSelfDriverStatus,
      confidence: 0.9,
      rawInput: voiceInput,
      interpretation: `Convert ${participant.name} to ${status}`,
      ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
    };
  }

  // Try seat capacity pattern
  match = patterns.seatCapacity.exec(input);
  if (match) {
    const name = match[1] || match[3];
    const seats = parseInt(match[2] || match[4], 10);

    if (isNaN(seats) || seats < 0 || seats > 8) {
      return {
        type: "seat_capacity",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Invalid seat count "${seats}". Must be 0-8.`,
        ambiguities: ambiguities,
      };
    }

    const participant = findParticipant(name.trim());
    if (!participant) {
      return {
        type: "seat_capacity",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Could not find participant "${name}"`,
        ambiguities: ambiguities,
      };
    }

    if (!participant.driver) {
      return {
        type: "seat_capacity",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `${participant.name} is not a driver. Only drivers can have seat capacity.`,
        ambiguities: ambiguities,
      };
    }

    return {
      type: "seat_capacity",
      participantId: participant.id,
      participantName: participant.name,
      newSeats: seats,
      confidence: 0.9,
      rawInput: voiceInput,
      interpretation: `Set ${participant.name}'s seat capacity to ${seats}`,
      ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
    };
  }

  // Try move rider pattern
  match = patterns.moveRider.exec(input);
  if (match) {
    const riderName = match[1].trim();
    const driverName = match[2].trim();

    const rider = findParticipant(riderName);
    if (!rider) {
      return {
        type: "move_rider",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Could not find rider "${riderName}"`,
        ambiguities: ambiguities,
      };
    }

    const driver = findParticipant(driverName);
    if (!driver) {
      return {
        type: "move_rider",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Could not find driver "${driverName}"`,
        ambiguities: ambiguities,
      };
    }

    if (!driver.driver || driver.selfDriver) {
      return {
        type: "move_rider",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `${driver.name} is not a driver. Cannot move rider to non-driver.`,
        ambiguities: ambiguities,
      };
    }

    const targetCarId = `car-${driver.id}`;

    return {
      type: "move_rider",
      participantId: rider.id,
      participantName: rider.name,
      targetCarId,
      targetDriverName: driver.name,
      confidence: 0.9,
      rawInput: voiceInput,
      interpretation: `Move ${rider.name} to ${driver.name}'s car`,
      ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
    };
  }

  // Try set status pattern (multiple format support)
  const statusPatterns = [
    /(?:confirm|mark)\s+(.+?)\s+as\s+(confirmed|present|cancelled|awaiting|ambiguous|text_sent)/i,
    /(.+?)\s+is\s+(confirmed|present|cancelled|awaiting|ambiguous|text_sent)/i,
    /(confirm|mark.*as\s+present|cancel)\s+(.+)/i,
  ];

  for (const statusPattern of statusPatterns) {
    match = statusPattern.exec(input);
    if (match) {
      let name = "";
      let status = "";

      if (match[1] === "confirm" || match[1] === "cancel") {
        // Format: "confirm Alex" or "cancel Maria"
        name = match[2];
        status = match[1] === "confirm" ? "confirmed" : "cancelled";
      } else if (match[1]?.toLowerCase().includes("mark")) {
        // Format: "mark Alex as present"
        name = match[2];
        status = match[3];
      } else {
        // Format: "Alex is confirmed"
        name = match[1];
        status = match[2];
      }

      if (!name) continue;

      const validStatuses = ["confirmed", "present", "cancelled", "awaiting", "ambiguous", "text_sent"];
      const normalizedStatus = status.toLowerCase().replace(/ /g, "_") as EventStatus;

      if (!validStatuses.includes(normalizedStatus)) continue;

      const participant = findParticipant(name.trim());
      if (!participant) {
        return {
          type: "set_status",
          confidence: 0,
          rawInput: voiceInput,
          interpretation: `Could not find participant "${name}"`,
          ambiguities: ambiguities,
        };
      }

      return {
        type: "set_status",
        participantId: participant.id,
        participantName: participant.name,
        newEventStatus: normalizedStatus,
        confidence: 0.9,
        rawInput: voiceInput,
        interpretation: `Set ${participant.name}'s status to ${normalizedStatus}`,
        ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
      };
    }
  }

  // No pattern matched
  return {
    type: "driver_status",
    confidence: 0,
    rawInput: voiceInput,
    interpretation: "Could not parse command. Try: 'make Alex a driver', 'Alex has 4 seats', 'move Alex to John\\'s car', or 'confirm Alex'",
    ambiguities: ambiguities,
  };
}

export function generateMockInsights(participants: Participant[]): Insight[] {
  const awaiting = participants.filter((p) => p.status === "awaiting");
  const ambiguous = participants.filter((p) => p.status === "ambiguous");
  const noCar = participants.filter(
    (p) => !p.driver && p.status !== "cancelled" && !p.carId,
  );

  const insights: Insight[] = [];

  if (awaiting.length > 0) {
    insights.push({
      id: "awaiting-followup",
      title: "Follow up on pending responses",
      description: `${awaiting.length} participants still have no text status update.`,
      severity: "medium",
      suggestion: "Bulk mark as text sent after outreach.",
      relatedParticipantIds: awaiting.slice(0, 8).map((p) => p.id),
    });
  }

  if (ambiguous.length > 0) {
    insights.push({
      id: "ambiguous-review",
      title: "Ambiguous responses need review",
      description: `${ambiguous.length} replies look ambiguous and should be manually verified.`,
      severity: "high",
      suggestion: "Flag these users for officer callback.",
      relatedParticipantIds: ambiguous.slice(0, 8).map((p) => p.id),
    });
  }

  if (noCar.length > 0) {
    insights.push({
      id: "unassigned-riders",
      title: "Unassigned riders detected",
      description: `${noCar.length} riders are still unassigned to a car.`,
      severity: "low",
      suggestion: "Run Auto Assign Carpools or drag riders manually.",
      relatedParticipantIds: noCar.slice(0, 8).map((p) => p.id),
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "all-clear",
      title: "Operations look healthy",
      description:
        "No major operational risks detected. Keep monitoring confirmations and check-ins.",
      severity: "low",
    });
  }

  return insights;
}
