export type EventStatus =
  | "awaiting"
  | "text_sent"
  | "ambiguous"
  | "confirmed"
  | "cancelled"
  | "present";

export type CheckInState = "present" | "no_show" | null;

export interface Participant {
  id: string;
  name: string;
  phone: string;
  email: string;
  timestamp: string;
  driver: boolean;
  seats: number;
  selfDriver: boolean;
  riderPreferences: string;
  preferredRidePartners: string[];

  status: EventStatus;
  isOfficer: boolean;
  appNotes: string;
  carId: string | null;
  seatIndex: number | null;
  checkInState: CheckInState;
}

export interface Car {
  id: string;
  driverId: string;
  driverName: string;
  seatsTotal: number;
  seatsUsed: number;
  riderIds: string[];
  seatAssignments: Array<string | null>;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  suggestion?: string;
  relatedParticipantIds?: string[];
}

export interface DashboardStats {
  totalSignedUp: number;
  confirmed: number;
  cancelled: number;
  awaitingResponse: number;
  carsCreated: number;
  officersAttending: number;
}

export interface EventData {
  participants: Participant[];
  cars: Car[];
  insights: Insight[];
  stats: DashboardStats;
}
