import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/utils";
import { Clock, FlaskConical, HelpCircle, NotepadText } from "lucide-react";

interface Properties {
  kind: "form" | "test";
  name: string;
  badges?: string[];
  meta: string[];
  actions?: React.ReactNode;
  className?: string;
}

// Shared card for questionnaires and tests in lists and catalogues.
export function InstrumentCard({ kind, name, badges = [], meta, actions, className }: Properties) {
  const Icon = kind === "form" ? NotepadText : FlaskConical;

  return (
    <Card className={cn("flex h-full flex-col gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="font-normal">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <h3 className="line-clamp-3 font-heading text-base font-semibold leading-snug">{name}</h3>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {meta.map((item, index) => {
          const MetaIcon = index === 0 ? HelpCircle : Clock;
          return (
            <span key={item} className="inline-flex items-center gap-1.5">
              <MetaIcon className="h-3.5 w-3.5" />
              {item}
            </span>
          );
        })}
      </div>
      {actions && <div className="grid grid-cols-2 gap-2">{actions}</div>}
    </Card>
  );
}
