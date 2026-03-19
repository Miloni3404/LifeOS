import { startOfDay, endOfDay, isToday, subDays, isSameDay } from 'date-fns';

export const getTodayRange = () => ({
  start: startOfDay(new Date()),
  end: endOfDay(new Date()),
});

export const isDateToday = (date: Date | string): boolean => {
  return isToday(new Date(date));
};

// Given an array of completion dates, calculate current streak
export const calculateStreak = (completionDates: Date[]): number => {
  if (!completionDates.length) return 0;

  const today = new Date();
  const sorted = [...completionDates].sort((a, b) => b.getTime() - a.getTime());
  const mostRecent = sorted[0];

  // If most recent is not today or yesterday — streak is broken
  const daysSinceLast = Math.floor(
    (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSinceLast > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const expectedDate = subDays(sorted[i - 1], 1);
    if (isSameDay(sorted[i], expectedDate)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
