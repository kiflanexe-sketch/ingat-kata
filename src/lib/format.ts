const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "12 menit lagi", "3 jam lagi", "besok", "5 hari lagi".
export function formatDueIn(ms: number): string {
  if (ms <= 0) return 'sekarang';
  if (ms < MINUTE) return 'sebentar lagi';
  if (ms < HOUR) return `${Math.ceil(ms / MINUTE)} menit lagi`;
  if (ms < DAY) return `${Math.round(ms / HOUR)} jam lagi`;
  if (ms < 2 * DAY) return 'besok';
  return `${Math.round(ms / DAY)} hari lagi`;
}

export const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;
