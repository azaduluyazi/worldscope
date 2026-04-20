import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — WorldScope",
  description: "Create your WorldScope account.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060509] p-6">
      <SignUp />
    </div>
  );
}
