// Pengingat cadangan: muncul di halaman depan dan ringkasan sesi bila cadangan sudah lama.
import { formatAgo } from './format.ts';

const DAY = 24 * 60 * 60 * 1000;

export const BACKUP_INTERVALS = [3, 7, 14];
export const DEFAULT_BACKUP_DAYS = 7;
export const MIN_CARDS_FOR_REMINDER = 10; // deck yang baru dibuat belum perlu diingatkan

export function backupReminder(lastBackupAt: number | null, totalCards: number, now: number, everyDays: number): string | null {
  if (totalCards < MIN_CARDS_FOR_REMINDER) return null;
  if (lastBackupAt === null) return `${totalCards} katamu belum pernah dicadangkan.`;
  if (now - lastBackupAt <= everyDays * DAY) return null;
  return `Cadangan terakhir ${formatAgo(lastBackupAt, now)}.`;
}
