"use client";

import { createOrganization } from "@/actions/organization/organization-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewOrganizationForm() {
  const t = useTranslations("organizations.new");
  const common = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      return (await createOrganization(name)).slug;
    },
    onSuccess: (slug) => {
      router.push(`/${slug}`);
      router.refresh();
    },
    onError: (error) =>
      toast({ title: common("error"), description: error.message || t("error"), variant: "destructive" }),
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="organization">{t("name")}</Label>
        <Input
          id="organization"
          required
          minLength={2}
          maxLength={100}
          autoComplete="organization"
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <Button type="submit" size="lg" disabled={mutation.isPending || name.trim().length < 2}>
        {t("submit")}
      </Button>
    </form>
  );
}
