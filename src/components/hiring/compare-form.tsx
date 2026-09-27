"use client";

import { Button } from "@/components/ui/button";
import { COMPARE_MAX, COMPARE_MIN } from "@/utils/target-profiles";
import { Columns3 } from "lucide-react";
import { useTranslations } from "next-intl";
import Form from "next/form";
import { useRef, useState } from "react";

// Wraps a list whose rows have "s" checkboxes (SubmissionList with selectName="s") and opens the
// compare view with the ticked results, 2 to 4 of them.
export function CompareForm({ action, target, children }: { action: string; target?: string | null; children: React.ReactNode }) {
  const t = useTranslations("hiring.compare");
  const form = useRef<HTMLFormElement>(null);
  const [count, setCount] = useState(0);
  const ready = count >= COMPARE_MIN && count <= COMPARE_MAX;

  return (
    <Form
      ref={form}
      action={action}
      onChange={() => setCount(form.current?.querySelectorAll('input[name="s"]:checked').length ?? 0)}
      className="flex flex-col gap-3"
    >
      {target && <input type="hidden" name="target" value={target} />}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {count > COMPARE_MAX ? t("tooMany", { max: COMPARE_MAX }) : t("hint", { count })}
        </p>
        <Button type="submit" variant="outline" disabled={!ready}>
          <Columns3 className="h-4 w-4" />
          {t("button")}
        </Button>
      </div>
      {children}
    </Form>
  );
}
