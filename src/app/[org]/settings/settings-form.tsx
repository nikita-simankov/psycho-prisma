"use client";

import { updateOrganizationSettings } from "@/actions/organization/organization-actions";
import { useOrganization } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CUSTOM_FIELD_TYPES, fieldKey, type CustomField } from "@/utils/profile-fields";
import { CANDIDATE_RETENTION_OPTIONS, RETENTION_OPTIONS } from "@/utils/retention-rules";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Settings = {
  name: string;
  privacyContact: string;
  respondentFeedback: boolean;
  feedbackTestIds: string[];
  customFields: CustomField[];
  retentionMonths: number;
  candidateRetentionMonths: number;
};

// One of the organization's own profile fields: its label, type and, for lists, the choices.
function CustomFieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: CustomField;
  onChange: (field: CustomField) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("settings.fields");
  const [options, setOptions] = useState(field.options.join(", "));

  return (
    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`field-${field.key}`}>{t("label")}</Label>
        <Input id={`field-${field.key}`} required maxLength={60} value={field.label} onChange={(event) => onChange({ ...field, label: event.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`type-${field.key}`}>{t("type")}</Label>
        <Select value={field.type} onValueChange={(type) => onChange({ ...field, type: type as CustomField["type"] })}>
          <SelectTrigger id={`type-${field.key}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CUSTOM_FIELD_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={t("remove", { label: field.label || t("label") })}>
        <Trash2 className="h-4 w-4" />
      </Button>
      {field.type === "select" && (
        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <Label htmlFor={`options-${field.key}`}>{t("options")}</Label>
          <Input
            id={`options-${field.key}`}
            value={options}
            placeholder={t("optionsHint")}
            onChange={(event) => {
              setOptions(event.target.value);
              onChange({ ...field, options: Array.from(new Set(event.target.value.split(",").map((option) => option.trim()).filter(Boolean))) });
            }}
          />
        </div>
      )}
    </div>
  );
}

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("retention.title")}</CardTitle>
          <CardDescription>{t("retention.text")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["retentionMonths", RETENTION_OPTIONS],
              ["candidateRetentionMonths", CANDIDATE_RETENTION_OPTIONS],
            ] as const
          ).map(([key, options]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={key}>{t(`retention.${key}`)}</Label>
              <Select value={String(values[key])} onValueChange={(value) => setValues({ ...values, [key]: Number(value) })}>
                <SelectTrigger id={key}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((months) => (
                    <SelectItem key={months} value={String(months)}>
                      {months === 0 ? t("retention.keep") : t("retention.months", { count: months })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t(`retention.${key}Hint`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("fields.title")}</CardTitle>
          <CardDescription>{t("fields.text")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {values.customFields.map((field, index) => (
            <CustomFieldRow
              key={field.key}
              field={field}
              onChange={(next) =>
                setValues({ ...values, customFields: values.customFields.map((entry, i) => (i === index ? next : entry)) })
              }
              onRemove={() => setValues({ ...values, customFields: values.customFields.filter((_, i) => i !== index) })}
            />
          ))}
          {values.customFields.length < 20 && (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() =>
                setValues({
                  ...values,
                  customFields: [
                    ...values.customFields,
                    {
                      key: fieldKey(`field ${values.customFields.length + 1}`, values.customFields.map((field) => field.key)),
                      label: "",
                      type: "text",
                      options: [],
                    },
                  ],
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("fields.add")}
            </Button>
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
