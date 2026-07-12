export const BOOKING_TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
];

export const BOOKING_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const BOOKING_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function generateBookingDates(count = 14) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export function parseBookingTimeSlot(slot: string) {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const [, hoursString, minutesString, period] = match;
  let hours = Number(hoursString);
  const minutes = Number(minutesString);
  const isPm = period.toUpperCase() === 'PM';

  if (isPm && hours !== 12) {
    hours += 12;
  }
  if (!isPm && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

export function isBookingSlotAvailable(date: Date, slot: string) {
  const parsed = parseBookingTimeSlot(slot);
  if (!parsed) return false;

  const candidate = new Date(date);
  candidate.setHours(parsed.hours, parsed.minutes, 0, 0);

  if (date.toDateString() === new Date().toDateString()) {
    return candidate.getTime() > Date.now();
  }

  return true;
}

export function formatBookingDisplayDate(d: Date) {
  return `${BOOKING_DAYS[d.getDay()]}, ${BOOKING_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatBookingEndTime(start: string, durationMinutes: number) {
  const parsed = parseBookingTimeSlot(start);
  if (!parsed) return '';

  const startMinutes = parsed.hours * 60 + parsed.minutes;
  const totalMins = startMinutes + durationMinutes;
  const endH = Math.floor(totalMins / 60) % 12 || 12;
  const endM = totalMins % 60;
  const endPeriod = Math.floor(totalMins / 60) >= 12 ? 'PM' : 'AM';
  return `${endH}:${endM.toString().padStart(2, '0')} ${endPeriod}`;
}
