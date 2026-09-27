"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

// Same value as NO_TARGET in src/utils/hiring.ts, which is server-only.
const NONE = "none";

// Chooses the target profile a page reads results against; the choice lives in the address.
export function TargetPicker({ profiles, current }: { profiles: { id: string; name: string }[]; current: string | null }) {
  const t = useTranslations("hiring.targets");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (profiles.length === 0) return null;

  const choose = (value: string) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("target", value);
    startTransition(() => router.replace(`${pathname}?${query.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex items-center gap-2 print:hidden" aria-busy={pending}>
      <Label htmlFor="target-profile" className="shrink-0 text-sm text-muted-foreground">
        {t("pickerLabel")}
      </Label>
      <Select value={current ?? NONE} onValueChange={choose}>
        <SelectTrigger id="target-profile" className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
          <SelectItem value={NONE}>{t("noTarget")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
