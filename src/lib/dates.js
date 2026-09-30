// Day keys are "YYYY-MM-DD" strings in the user's local time.
// Never derive them with toISOString(): that converts to UTC and shifts the
// day for anyone not at UTC+0 (e.g. after 5pm in California).

export function toDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Local midnight for a day key.
export function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

// Columns of 7 day keys, one column per week, aligned so row 0 is weekStart
// (0 = Sunday). The last column is the current week; days after today are
// still included so callers can render them as blanks.
export function weekColumns(todayKey, weeks, weekStart = 0) {
  const offset = (fromDateKey(todayKey).getDay() - weekStart + 7) % 7;
  const start = addDays(todayKey, -offset - (weeks - 1) * 7);
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) col.push(addDays(start, w * 7 + d));
    cols.push(col);
  }
  return cols;
}

// Month labels for the top of the grid: one at each column whose week starts
// a new month. The first column's label is dropped when the next one would
// sit closer than minGap columns, so labels never run into each other.
export function monthLabels(cols, minGap = 3) {
  const labels = [];
  cols.forEach((col, i) => {
    const month = fromDateKey(col[0]).getMonth();
    const prev = i > 0 ? fromDateKey(cols[i - 1][0]).getMonth() : null;
    if (i === 0 || month !== prev) {
      labels.push({
        index: i,
        text: fromDateKey(col[0])
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase(),
      });
    }
  });
  if (labels.length > 1 && labels[0].index === 0 && labels[1].index < minGap) {
    labels.shift();
  }
  return labels;
}

// The day you're logging for. A day stays open until lockHour the next
// morning (default 3:00), so a 1am session still counts for yesterday.
export const DEFAULT_LOCK_HOUR = 3;

export function logicalToday(now = new Date(), lockHour = DEFAULT_LOCK_HOUR) {
  const key = toDateKey(now);
  return now.getHours() < lockHour ? addDays(key, -1) : key;
}

// Only the current logical day can be logged or edited; past days are locked.
export function isOpen(
  dateKey,
  now = new Date(),
  lockHour = DEFAULT_LOCK_HOUR,
) {
  return dateKey === logicalToday(now, lockHour);
}
