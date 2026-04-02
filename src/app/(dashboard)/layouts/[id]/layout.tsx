import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const name = id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${name} — Layout Editor`,
    description: `Edit and customize the ${name} dashboard layout.`,
  };
}

export default function LayoutEditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
