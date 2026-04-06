import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "CyberScope — Cybersecurity Intelligence",
  description: "Cyber threats, CVE vulnerabilities, internet outages, ransomware tracking, and digital security monitoring.",
  keywords: [
    "cybersecurity dashboard", "CVE tracker", "ransomware monitor",
    "internet outages map", "hacking news", "cyber threat intelligence",
    "GPS jamming map", "phishing tracker", "botnet C2 servers",
    "real-time cyber threats", "vulnerability scanner", "APT tracking",
    "cyber attack", "cyber attack map", "cyber attack today",
    "siber güvenlik", "siber tehdit haritası", "güvenlik açığı takip",
    "siber saldırı",
  ],
  alternates: {
    canonical: "/cyber",
  },
};
export default function CyberLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
