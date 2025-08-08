'use client';

import { SessionProvider } from "next-auth/react";
import { LoginPromptProvider } from "@/context/LoginPromptContext";
import LoginPrompt from "@/components/LoginPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoginPromptProvider>
        {children}
        <LoginPrompt />
      </LoginPromptProvider>
    </SessionProvider>
  );
}
