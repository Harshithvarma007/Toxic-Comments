import type { ReactNode } from "react";

export function Section({
  id,
  index,
  eyebrow,
  title,
  lede,
  children,
}: {
  id?: string;
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="mx-auto mt-28 max-w-6xl px-4 sm:mt-36 sm:px-6">
      <p className="label-mono flex gap-3">
        {index && <span className="text-accent">{index}</span>}
        {eyebrow}
      </p>
      <h2
        id={id ? `${id}-title` : undefined}
        className="mt-3 max-w-3xl font-display text-[clamp(1.875rem,1.3rem+2.4vw,3rem)] font-bold leading-[1.1] tracking-[-0.03em] text-peak"
      >
        {title}
      </h2>
      {lede && <p className="measure mt-5 text-lg leading-relaxed text-secondary">{lede}</p>}
      {children && <div className="mt-12">{children}</div>}
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "danger" | "success" }) {
  return (
    <div className="bg-surface p-5 sm:p-6">
      <p className="label-mono">{label}</p>
      <p
        className={`mt-2 font-display text-[2.5rem] font-bold leading-none tracking-[-0.03em] tabular-nums ${
          tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-peak"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-2 text-sm text-secondary">{sub}</p>}
    </div>
  );
}

export function ButtonLink({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      className={`group relative inline-flex items-center gap-2 rounded-[3px] px-4 py-2.5 text-[0.9375rem] font-semibold transition-colors ${
        primary ? "bg-accent text-ground hover:bg-[#f8d2d2]" : "border border-line-strong text-primary hover:border-accent/60"
      }`}
    >
      {children}
    </a>
  );
}
