import { SRS_INTERVALS, SRS_STAGES } from '@/constants/srs';

/**
 * Calculate new SRS stage based on WaniKani formula
 * @param currentStage - Current SRS stage (1-9)
 * @param isCorrect - Whether the answer was correct
 * @param incorrectCount - Number of incorrect answers in this session
 * @returns New SRS stage
 */
export function calculateNewStage(
  currentStage: number,
  isCorrect: boolean,
  incorrectCount: number
): number {
  // Correct answer: advance one stage
  if (isCorrect) {
    return Math.min(currentStage + 1, SRS_STAGES.BURNED);
  }

  // Incorrect answer: apply WaniKani penalty formula
  const incorrectAdjustmentCount = Math.ceil(incorrectCount / 2);
  const srsPenaltyFactor = currentStage >= SRS_STAGES.GURU_1 ? 2 : 1;
  const newStage = currentStage - incorrectAdjustmentCount * srsPenaltyFactor;

  return Math.max(SRS_STAGES.APPRENTICE_1, newStage);
}

/**
 * Calculate the next due date based on current stage
 * @param stage - Current SRS stage
 * @returns ISO 8601 date string, or null if burned
 */
export function calculateDueDate(stage: number): string | null {
  const interval = SRS_INTERVALS[stage];

  if (interval === null) {
    return null; // Burned cards have no due date
  }

  const now = new Date();
  const dueDate = new Date(now.getTime() + interval * 1000);
  return dueDate.toISOString();
}

/**
 * Check if a card is due for review
 * @param dueDate - ISO 8601 due date string
 * @returns True if the card is due now
 */
export function isCardDue(dueDate: string | null): boolean {
  if (dueDate === null) return false;
  return new Date(dueDate) <= new Date();
}

/**
 * Format time duration in HH:MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}
