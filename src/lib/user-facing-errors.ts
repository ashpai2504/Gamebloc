/**
 * Short messages safe to show in the browser. Log technical details with console.error instead.
 */
export const AUTH_MESSAGES = {
  dbUnavailable:
    "We can't complete sign-in right now. Please try again in a moment.",
  /** Atlas <db_password> still in MONGODB_URI */
  dbUriPlaceholder:
    "Database login isn’t configured. In .env.local, replace the Atlas placeholder <db_password> in MONGODB_URI with your real database user password (Atlas → Database Access), or use a credential-free URI plus MONGODB_USER and MONGODB_PASSWORD. Restart the dev server after saving.",
  /** MONGODB_USER set but MONGODB_PASSWORD missing / empty */
  dbPasswordMissing:
    "Database login isn’t configured. Set MONGODB_PASSWORD in .env.local to your Atlas database user password (same user as MONGODB_USER), then restart the dev server.",
} as const;
