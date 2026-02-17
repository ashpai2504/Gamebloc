import { Suspense } from "react";
import AuthModal from "@/components/AuthModal";

export const metadata = {
  title: "Sign In - Gamebloc",
  description: "Sign in or create an account to join the live sports chat.",
};

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthModal />
    </Suspense>
  );
}
