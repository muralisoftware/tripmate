export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  } catch {
    return dateStr;
  }
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate) return '';
  if (!endDate || startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function calculateDurationDays(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : Math.max(1, diffDays);
  } catch {
    return 1;
  }
}

export function getTripStatus(
  startDate: string,
  endDate: string
): 'upcoming' | 'ongoing' | 'completed' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (today < start) {
    return 'upcoming';
  } else if (today > end) {
    return 'completed';
  }
  return 'ongoing';
}

export function getDaysCountdown(startDate: string, endDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const msPerDay = 1000 * 60 * 60 * 24;

  if (today < start) {
    const diffDays = Math.ceil((start.getTime() - today.getTime()) / msPerDay);
    return diffDays === 1 ? 'Starts tomorrow' : `Starts in ${diffDays} days`;
  } else if (today <= end) {
    const currentDay = Math.floor((today.getTime() - start.getTime()) / msPerDay) + 1;
    const totalDays = calculateDurationDays(startDate, endDate);
    return `Ongoing (Day ${currentDay}/${totalDays})`;
  } else {
    return 'Trip completed';
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
