import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "CyberScope — Cybersecurity Intelligence",
  description: "Cyber threats, CVE vulnerabilities, internet outages, ransomware tracking, and digital security monitoring.",
  keywords: ["cybersecurity", "hacking", "CVE", "ransomware", "internet outages"],
};
export default function CyberLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
