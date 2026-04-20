import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — WorldScope",
  description: "Sign in to your WorldScope account.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060509] p-6">
      <SignIn />
    </div>
  );
}
