export const PUBLIC_LAUNCH_TIMESTAMP = Date.parse("2026-11-15T20:00:00-05:00");
const easternFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
function easternParts(timestamp: number): Record<string, number> {
  return Object.fromEntries(
    easternFormatter
      .formatToParts(timestamp)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}
export function nextSundayDropTimestamp(now: number): number {
  if (now < PUBLIC_LAUNCH_TIMESTAMP) return PUBLIC_LAUNCH_TIMESTAMP;
  const current = easternParts(now);
  const weekday = new Date(
    Date.UTC(current.year, current.month - 1, current.day),
  ).getUTCDay();
  let daysAhead = (7 - weekday) % 7;
  if (daysAhead === 0 && current.hour >= 20) daysAhead = 7;
  const targetWallTime = Date.UTC(
    current.year,
    current.month - 1,
    current.day + daysAhead,
    20,
  );
  let targetTimestamp = targetWallTime;
  for (let iteration = 0; iteration < 3; iteration++) {
    const candidate = easternParts(targetTimestamp);
    targetTimestamp +=
      targetWallTime -
      Date.UTC(
        candidate.year,
        candidate.month - 1,
        candidate.day,
        candidate.hour,
        candidate.minute,
        candidate.second,
      );
  }
  return targetTimestamp;
}
export function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 86400)}d ${Math.floor(seconds / 3600) % 24}h ${Math.floor(seconds / 60) % 60}m ${seconds % 60}s`;
}
