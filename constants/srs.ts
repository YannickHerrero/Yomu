// SRS Constants based on WaniKani system

export const SRS_STAGES = {
  NEW: 0, // New cards - not yet reviewed
  APPRENTICE_1: 1,
  APPRENTICE_2: 2,
  APPRENTICE_3: 3,
  APPRENTICE_4: 4,
  GURU_1: 5,
  GURU_2: 6,
  MASTER: 7,
  ENLIGHTENED: 8,
  BURNED: 9,
} as const;

// Intervals in seconds to next review
export const SRS_INTERVALS: Record<number, number | null> = {
  0: 0, // New - immediately due
  1: 4 * 60 * 60, // 4 hours
  2: 8 * 60 * 60, // 8 hours
  3: 24 * 60 * 60, // 1 day
  4: 2 * 24 * 60 * 60, // 2 days
  5: 7 * 24 * 60 * 60, // 1 week
  6: 14 * 24 * 60 * 60, // 2 weeks
  7: 30 * 24 * 60 * 60, // 1 month (~30 days)
  8: 120 * 24 * 60 * 60, // 4 months (~120 days)
  9: null, // Burned - no next review
};

// Group names for display
export const SRS_GROUP_NAMES: Record<number, string> = {
  0: 'New',
  1: 'Apprentice 1',
  2: 'Apprentice 2',
  3: 'Apprentice 3',
  4: 'Apprentice 4',
  5: 'Guru 1',
  6: 'Guru 2',
  7: 'Master',
  8: 'Enlightened',
  9: 'Burned',
};

// Group colors for badges (using Gluestack color tokens)
export const SRS_GROUP_COLORS: Record<string, string> = {
  apprentice: 'bg-pink-500',
  guru: 'bg-purple-500',
  master: 'bg-blue-500',
  enlightened: 'bg-cyan-500',
  burned: 'bg-gray-500',
};

// Helper to get group name from stage
export function getGroupFromStage(stage: number): string {
  if (stage === 0) return 'new';
  if (stage >= 1 && stage <= 4) return 'apprentice';
  if (stage >= 5 && stage <= 6) return 'guru';
  if (stage === 7) return 'master';
  if (stage === 8) return 'enlightened';
  if (stage === 9) return 'burned';
  return 'new';
}
