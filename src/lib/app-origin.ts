import type { NextRequest } from "next/server";

/**
 * Resolve the public origin for the current request.
 * This avoids hardcoding localhost in server-side fetches on Vercel.
 */
export function getRequestOrigin(request: NextRequest): string {
  const url = new URL(request.url);
  return url.origin;
}
