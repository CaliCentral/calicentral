export const MAX_ACTIVE_SUBMISSIONS_PER_CONTRIBUTOR = 25;

export function hasReachedActiveSubmissionLimit(count: number): boolean {
  return (
    !Number.isInteger(count) ||
    count < 0 ||
    count >= MAX_ACTIVE_SUBMISSIONS_PER_CONTRIBUTOR
  );
}
