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
  const ambiguities: string[] = [];
  const normalizedInput = voiceInput
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const wordToNumber: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
  };

  const roleAliases: Record<string, "driver" | "self-driver" | "rider"> = {
    driver: "driver",
    drivers: "driver",
    "self driver": "self-driver",
    "self-driver": "self-driver",
    selfdriver: "self-driver",
    rider: "rider",
    riders: "rider",
    passenger: "rider",
    passengers: "rider",
  };

  const statusAliases: Record<string, EventStatus> = {
    awaiting: "awaiting",
    wait: "awaiting",
    waiting: "awaiting",
    pending: "awaiting",
    "text sent": "text_sent",
    texted: "text_sent",
    ambiguous: "ambiguous",
    unsure: "ambiguous",
    confirmed: "confirmed",
    confirm: "confirmed",
    cancelled: "cancelled",
    canceled: "cancelled",
    cancel: "cancelled",
    present: "present",
    arrived: "present",
    checkedin: "present",
    "checked in": "present",
  };

  const findParticipant = (name: string): Participant | undefined => {
    const clean = name
      .toLowerCase()
      .replace(/\b(the|a|an|please)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) return undefined;

    const exact = participants.find((p) => p.name.toLowerCase() === clean);
    if (exact) return exact;

    const byWord = participants.filter((p) => {
      const pName = p.name.toLowerCase();
      const parts = pName.split(" ");
      return pName.includes(clean) || clean.includes(pName) || parts.some((part) => clean === part);
    });

    if (byWord.length === 1) return byWord[0];
    if (byWord.length > 1) {
      ambiguities.push(
        `Found ${byWord.length} matches for \"${name}\": ${byWord
          .slice(0, 5)
          .map((p) => p.name)
          .join(", ")}`,
      );
      return byWord[0];
    }

    return undefined;
  };

  const extractSeatCount = (text: string): number | null => {
    const digit = text.match(/\b([0-8])\b/);
    if (digit) return Number.parseInt(digit[1], 10);

    for (const [word, value] of Object.entries(wordToNumber)) {
      if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
        return value;
      }
    }
    return null;
  };

  const normalizeRole = (text: string): "driver" | "self-driver" | "rider" | null => {
    const candidate = text.trim().toLowerCase();
    if (roleAliases[candidate]) return roleAliases[candidate];

    const key = Object.keys(roleAliases).find((k) => candidate.includes(k));
    return key ? roleAliases[key] : null;
  };

  const normalizeStatus = (text: string): EventStatus | null => {
    const candidate = text.trim().toLowerCase();
    if (statusAliases[candidate]) return statusAliases[candidate];

    const key = Object.keys(statusAliases).find((k) => candidate.includes(k));
    return key ? statusAliases[key] : null;
  };

  // 1) Move rider patterns: "move alex to john's car", "put alex with john"
  const moveMatch = normalizedInput.match(
    /(?:move|put|assign|place|seat)\s+(.+?)\s+(?:to|into|in|with|inside)\s+(.+?)(?:\s+car)?$/i,
  );
  if (moveMatch) {
    const rider = findParticipant(moveMatch[1].replace(/\b(in|to)\b$/i, "").trim());
    const driverName = moveMatch[2]
      .replace(/(?:'s)?\s*car$/i, "")
      .replace(/'s$/i, "")
      .trim();
    const driver = findParticipant(driverName);

    if (!rider) {
      return {
        type: "move_rider",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Could not find rider \"${moveMatch[1].trim()}\"`,
        ambiguities,
      };
    }

    if (!driver || !driver.driver || driver.selfDriver) {
      return {
        type: "move_rider",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Could not find a valid driver \"${driverName}\"`,
        ambiguities,
      };
    }

    return {
      type: "move_rider",
      participantId: rider.id,
      participantName: rider.name,
      targetCarId: `car-${driver.id}`,
      targetDriverName: driver.name,
      confidence: 0.95,
      rawInput: voiceInput,
      interpretation: `Move ${rider.name} to ${driver.name}'s car`,
      ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
    };
  }

  // 2) Seat capacity patterns: "alex has four seats", "set john seats to 5"
  const seatMatch = normalizedInput.match(
    /(?:set|change|update|give)?\s*(.+?)\s+(?:has|have|with|gets?|needs?|seat(?:s)?(?:\s+capacity)?(?:\s+to)?|capacity(?:\s+to)?)\s+(.+)$/i,
  );
  if (seatMatch) {
    const participant = findParticipant(seatMatch[1].trim());
    const seats = extractSeatCount(seatMatch[2]);

    if (participant && seats !== null) {
      if (!participant.driver) {
        return {
          type: "seat_capacity",
          confidence: 0,
          rawInput: voiceInput,
          interpretation: `${participant.name} is not a driver. Only drivers can have seat capacity.`,
          ambiguities,
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
  }

  // 3) Driver role conversion: "make alex a driver", "alex should be self driver", "alex is rider"
  const driverMatch = normalizedInput.match(
    /(?:make|set|convert|change)?\s*(.+?)\s+(?:to|as|a|an|should be|is)\s+(self[-\s]?driver|driver|rider|passenger)/i,
  );
  if (driverMatch) {
    const participant = findParticipant(driverMatch[1].trim());
    const role = normalizeRole(driverMatch[2]);

    if (!participant) {
      return {
        type: "driver_status",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: `Could not find participant \"${driverMatch[1].trim()}\"`,
        ambiguities,
      };
    }

    if (!role) {
      return {
        type: "driver_status",
        confidence: 0,
        rawInput: voiceInput,
        interpretation: "Could not determine driver role.",
        ambiguities,
      };
    }

    return {
      type: "driver_status",
      participantId: participant.id,
      participantName: participant.name,
      newDriverStatus: role !== "rider",
      newSelfDriverStatus: role === "self-driver",
      confidence: 0.9,
      rawInput: voiceInput,
      interpretation: `Convert ${participant.name} to ${role}`,
      ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
    };
  }

  // 4) Status updates: "confirm alex", "mark alex as present", "alex is cancelled"
  const statusVerbs = ["confirm", "cancel", "mark", "set", "update"];
  const startsWithStatusVerb = statusVerbs.some((v) => normalizedInput.startsWith(v));

  if (startsWithStatusVerb) {
    const verbStyle = normalizedInput.match(/^(confirm|cancel|mark|set|update)\s+(.+?)(?:\s+as\s+(.+))?$/i);
    if (verbStyle) {
      const verb = verbStyle[1].toLowerCase();
      const statusFromVerb = normalizeStatus(verb);
      const namePart = verbStyle[2].trim();
      const explicitStatus = verbStyle[3] ? normalizeStatus(verbStyle[3]) : null;
      const targetStatus = explicitStatus ?? statusFromVerb;

      const participant = findParticipant(namePart);
      if (!participant) {
        return {
          type: "set_status",
          confidence: 0,
          rawInput: voiceInput,
          interpretation: `Could not find participant \"${namePart}\"`,
          ambiguities,
        };
      }

      if (!targetStatus) {
        return {
          type: "set_status",
          confidence: 0,
          rawInput: voiceInput,
          interpretation: "Could not determine target status.",
          ambiguities,
        };
      }

      return {
        type: "set_status",
        participantId: participant.id,
        participantName: participant.name,
        newEventStatus: targetStatus,
        confidence: 0.9,
        rawInput: voiceInput,
        interpretation: `Set ${participant.name}'s status to ${targetStatus}`,
        ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
      };
    }
  }

  const statusIsPattern = normalizedInput.match(/^(.+?)\s+(?:is|as)\s+(.+)$/i);
  if (statusIsPattern) {
    const participant = findParticipant(statusIsPattern[1].trim());
    const status = normalizeStatus(statusIsPattern[2]);
    if (participant && status) {
      return {
        type: "set_status",
        participantId: participant.id,
        participantName: participant.name,
        newEventStatus: status,
        confidence: 0.85,
        rawInput: voiceInput,
        interpretation: `Set ${participant.name}'s status to ${status}`,
        ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
      };
    }
  }

  return {
    type: "driver_status",
    confidence: 0,
    rawInput: voiceInput,
    interpretation:
      "Could not parse command. Try examples: 'move Alex to John's car', 'make Alex a self-driver', 'set John seats to 4', 'mark Alex as present'.",
    ambiguities,
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
