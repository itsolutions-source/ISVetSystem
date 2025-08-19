export function normalize(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
export function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
export function daysBetween(a: Date, b: Date): number {
  const MS = 1000 * 60 * 60 * 24;
  return Math.ceil((b.getTime() - a.getTime()) / MS);
}
