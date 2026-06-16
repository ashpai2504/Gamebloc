"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import OpenDmAfterAuth from "./OpenDmAfterAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SessionProvider>
        <OpenDmAfterAuth />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
