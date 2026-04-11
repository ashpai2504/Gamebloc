/** After sign-in, `OpenDmAfterAuth` reads this and opens a DM with that user. */
export const DM_INTENT_STORAGE_KEY = "gamebloc.openDmUserId";

export function storeDmIntentAfterSignIn(targetUserId: string) {
  try {
    sessionStorage.setItem(DM_INTENT_STORAGE_KEY, targetUserId);
  } catch {
    /* ignore */
  }
}
