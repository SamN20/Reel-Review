/**
 * Onboarding state helpers.
 *
 * Keys stored in localStorage (per browser / per user — intentional, these are
 * purely UX preferences that don't need to live in the backend):
 *
 *   rr_has_voted      "1" → user has submitted at least one weekly vote
 *   rr_has_ranked     "1" → user has submitted at least one next-drop ballot
 */

export const ONBOARDING_KEY_VOTE = "rr_has_voted";
export const ONBOARDING_KEY_RANK = "rr_has_ranked";

export function hasCompletedOnboarding(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingComplete(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function resetOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY_VOTE);
    localStorage.removeItem(ONBOARDING_KEY_RANK);
  } catch {
    // silently skip
  }
}
