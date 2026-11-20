import { GlassCard } from "@/components/ui/glass-card";

interface LegalPageProps {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

export function LegalPage({ title, updated, sections }: LegalPageProps) {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
      <GlassCard className="mt-10 space-y-8 p-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-sans text-lg font-semibold">{s.heading}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </GlassCard>
    </div>
  );
}
