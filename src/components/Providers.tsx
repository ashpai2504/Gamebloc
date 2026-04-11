"use client";

import { SessionProvider } from "next-auth/react";
import OpenDmAfterAuth from "./OpenDmAfterAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OpenDmAfterAuth />
      {children}
    </SessionProvider>
  );
}
