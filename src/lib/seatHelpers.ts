export function getSeatLabel(
  seatIndex: number,
  totalRearSeats: number,
  isDriver: boolean = false,
): string {
  if (isDriver) return "Driver";
  if (seatIndex === 0) return "Passenger";

  if (totalRearSeats === 1) return "Rear";
  if (totalRearSeats === 2) {
    return seatIndex === 1 ? "Rear L" : "Rear R";
  }

  if (totalRearSeats === 3) {
    if (seatIndex === 1) return "Rear L";
    if (seatIndex === 2) return "Rear R";
    if (seatIndex === 3) return "Rear C";
  }

  if (totalRearSeats === 4) {
    if (seatIndex === 1) return "Middle L";
    if (seatIndex === 2) return "Middle R";
    if (seatIndex === 3) return "Rear L";
    if (seatIndex === 4) return "Rear R";
  }

  if (totalRearSeats === 5) {
    if (seatIndex === 1) return "Middle L";
    if (seatIndex === 2) return "Middle C";
    if (seatIndex === 3) return "Middle R";
    if (seatIndex === 4) return "Rear L";
    if (seatIndex === 5) return "Rear R";
  }

  return `Seat ${seatIndex}`;
}
