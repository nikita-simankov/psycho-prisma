"use client";

import { updateOrganizationSettings } from "@/actions/organization/organization-actions";
import { useOrganization } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Settings = { name: string; privacyContact: string; respondentFeedback: boolean; feedbackTestIds: string[] };

export function SettingsForm({ initial, tests }: { initial: Settings; tests: { id: string; name: string }[] }) {
  const t = useTranslations("settings");
  const common = useTranslations("common");
  const router = useRouter();
  const organization = useOrganization();
  const [values, setValues] = useState(initial);
  const changed = JSON.stringify(values) !== JSON.stringify(initial);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await updateOrganizationSettings(values);

      if ("error" in result) {
        throw new Error(t("nameTaken"));
      }

      return result.slug;
    },
    onSuccess: (slug) => {
      toast({ title: t("saved") });
      if (slug !== organization.slug) {
        router.replace(`/${slug}/settings`);
      }
      router.refresh();
    },
    onError: (error) =>
      toast({ title: common("error"), description: error.message || t("saveError"), variant: "destructive" }),
  });

  return (
    <form
      className="flex max-w-2xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("general")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="org-name">{t("name")}</Label>
          <Input
            id="org-name"
            required
            minLength={2}
            maxLength={100}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("privacy")}</CardTitle>
          <CardDescription>{t("privacyText")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="privacy-contact">{t("contact")}</Label>
            <Input
              id="privacy-contact"
              maxLength={300}
              placeholder={t("contactPlaceholder")}
              value={values.privacyContact}
              onChange={(event) => setValues({ ...values, privacyContact: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="respondent-feedback">{t("feedback")}</Label>
              <p className="text-sm text-muted-foreground">{t("feedbackText")}</p>
            </div>
            <Switch
              id="respondent-feedback"
              checked={values.respondentFeedback}
              onCheckedChange={(checked) => setValues({ ...values, respondentFeedback: checked })}
            />
          </div>
          {values.respondentFeedback && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium">{t("feedbackTests")}</legend>
              <p className="text-sm text-muted-foreground">{t("feedbackTestsText")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {tests.map((test) => {
                  const checked = values.feedbackTestIds.includes(test.id);
                  return (
                    <label key={test.id} className="flex items-start gap-2 rounded-md border p-2.5 text-sm">
                      <Checkbox
                        checked={checked}
                        className="mt-0.5"
                        onCheckedChange={(value) =>
                          setValues({
                            ...values,
                            feedbackTestIds: value
                              ? [...values.feedbackTestIds, test.id]
                              : values.feedbackTestIds.filter((id) => id !== test.id),
                          })
                        }
                      />
                      <span>{test.name}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
        </CardContent>
      </Card>
      <div>
        <Button type="submit" disabled={!changed || mutation.isPending}>
          {common("save")}
        </Button>
      </div>
    </form>
  );
}
