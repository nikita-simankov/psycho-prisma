import { cn } from "@/utils/utils";
import Link from "next/link";

// Building blocks for the four page templates. Every staff page starts with PageHeader, then:
// - Index (lists): Toolbar for filters and search, then the table or cards.
// - Detail (a person, a round, a report): DetailLayout with the content and an aside.
// - Editor (studio): full width, its own toolbar.
// - Settings: SettingsLayout with the section links on the left.

// A titled part of a page, set off by a rule above it rather than a box around it.
export function Section({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-4 border-t border-foreground/80 pt-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 print:hidden">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// The row of filters, search and view options above a list.
export function Toolbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4 flex flex-wrap items-center gap-2 print:hidden", className)}>{children}</div>;
}

// Main content with a narrower aside, which drops below it on small screens.
export function DetailLayout({ aside, children, className }: { aside: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]", className)}>
      <div className="flex min-w-0 flex-col gap-8">{children}</div>
      <aside className="flex flex-col gap-6 print:hidden">{aside}</aside>
    </div>
  );
}

// Settings sections as a list of links beside the form, a row of links on small screens.
export function SettingsLayout({
  sections,
  current,
  label,
  children,
}: {
  sections: { href: string; label: string }[];
  current: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
      <nav aria-label={label} className="flex gap-1 overflow-x-auto md:flex-col">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            aria-current={section.href === current ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
              section.href === current
                ? "bg-card font-medium text-foreground shadow-[inset_2px_0_0_var(--primary)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
