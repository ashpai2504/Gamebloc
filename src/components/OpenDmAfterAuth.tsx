"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDMStore } from "@/lib/store";
import { DM_INTENT_STORAGE_KEY } from "@/lib/dm-intent";

/** Opens the DM panel for a user id saved before redirecting to sign-in. */
export default function OpenDmAfterAuth() {
  const { status } = useSession();
  const openDM = useDMStore((s) => s.openDM);

  useEffect(() => {
    if (status !== "authenticated") return;
    try {
      const id = sessionStorage.getItem(DM_INTENT_STORAGE_KEY);
      if (id) {
        sessionStorage.removeItem(DM_INTENT_STORAGE_KEY);
        openDM(id);
      }
    } catch {
      /* ignore */
    }
  }, [status, openDM]);

  return null;
}
