export type DueDateStatus = 'overdue' | 'today' | 'upcoming';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toLocalIsoDate(new Date());
}

export function formatDueDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dueDateStatus(value: string | null): DueDateStatus | null {
  if (!value) return null;
  const today = todayIsoDate();
  if (value < today) return 'overdue';
  if (value === today) return 'today';
  return 'upcoming';
}
