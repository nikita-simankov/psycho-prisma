import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/utils/utils";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

// Page frame for the public site.
export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col pb-20">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

// The opening of a page: eyebrow, title and a lead paragraph.
export function MarketingIntro({
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-12 pt-14 sm:pt-20", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="max-w-4xl text-4xl font-medium leading-[1.08] sm:text-5xl lg:text-6xl">{title}</h1>
      {lead && <p className="max-w-2xl text-lg text-muted-foreground">{lead}</p>}
      {children}
    </div>
  );
}

// A numbered, ruled section of a public page.
export function MarketingSection({
  number,
  title,
  lead,
  id,
  className,
  children,
}: {
  number?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-6xl scroll-mt-20 px-4 pt-14", className)}>
      <div className="grid gap-x-6 gap-y-2 border-t border-foreground/80 pt-4 md:grid-cols-[3rem_1fr]">
        {number && <span className="pt-2 font-mono text-sm text-primary">{number}</span>}
        <div className={cn("flex flex-col gap-2", !number && "md:col-span-2")}>
          <h2 className="text-2xl font-medium sm:text-3xl">{title}</h2>
          {lead && <p className="max-w-2xl text-muted-foreground">{lead}</p>}
        </div>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
