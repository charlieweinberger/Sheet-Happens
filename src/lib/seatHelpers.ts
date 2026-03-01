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
  // 3 or more rear seats
  if (seatIndex === 1) return "Rear L";
  if (seatIndex === totalRearSeats) return "Rear R";
  return "Rear C";
}

export function getSeatGridClass(rearSeatCount: number): string {
  if (rearSeatCount === 1) return "grid-cols-1";
  if (rearSeatCount === 2) return "grid-cols-2";
  return "grid-cols-3";
}
