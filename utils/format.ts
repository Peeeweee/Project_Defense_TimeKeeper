export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const parseMinutesToSeconds = (minutes: string | number): number => {
  const parsed = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (isNaN(parsed)) return 0;
  return Math.floor(parsed * 60);
};

export const parseSecondsToMinutes = (seconds: number): number => {
  return Math.floor(seconds / 60);
};