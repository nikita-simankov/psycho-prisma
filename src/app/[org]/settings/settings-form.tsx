"use client";

import { updateOrganizationSettings } from "@/actions/organization/organization-actions";
import { useOrganization } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CUSTOM_FIELD_TYPES, fieldKey, type CustomField } from "@/utils/profile-fields";
import { CANDIDATE_RETENTION_OPTIONS, RETENTION_OPTIONS } from "@/utils/retention-rules";
import { DEFAULT_RULES, DIRECTIONS, WEEKDAYS, type SupportLink, type WellbeingRule } from "@/utils/wellbeing";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Section } from "@/components/page-templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_GROUP } from "@/utils/results";

type Settings = {
  name: string;
  privacyContact: string;
  respondentFeedback: boolean;
  feedbackTestIds: string[];
  customFields: CustomField[];
  retentionMonths: number;
  candidateRetentionMonths: number;
  quietHours: boolean;
  timeZone: string;
  wellbeingRules: WellbeingRule[];
  digestEnabled: boolean;
  digestWeekday: number;
  supportText: string;
  supportContacts: string;
  supportLinks: SupportLink[];
};

export type RuleTest = { id: string; name: string; scales: { id: number; name: string }[] };

// Every time zone the browser knows, for the organization's default.
function timeZones() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC"];
  }
}

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

// One wellbeing rule: the scale it reads, which way is worse, and the three levels.
function RuleRow({
  rule,
  tests,
  onChange,
  onRemove,
}: {
  rule: WellbeingRule;
  tests: RuleTest[];
  onChange: (rule: WellbeingRule) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("settings.warnings");
  const test = tests.find((entry) => entry.id === rule.testId);
  const scale = test?.scales.find((entry) => entry.id === rule.scaleId);
  const name = rule.label || scale?.name || t("rule");
  const level = (key: "team" | "drop" | "person") => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${key}-${rule.id}`}>{t(key)}</Label>
      <Input
        id={`${key}-${rule.id}`}
        type="number"
        step="any"
        min={key === "drop" ? 0 : undefined}
        placeholder={t("off")}
        value={rule[key] ?? ""}
        onChange={(event) => onChange({ ...rule, [key]: event.target.value === "" ? null : Number(event.target.value) })}
      />
    </div>
  );

  return (
    <fieldset className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2" data-rule={rule.id}>
      <legend className="sr-only">{name}</legend>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`test-${rule.id}`}>{t("test")}</Label>
        <Select
          value={rule.testId}
          onValueChange={(testId) => onChange({ ...rule, testId, scaleId: tests.find((entry) => entry.id === testId)?.scales[0]?.id ?? 1 })}
        >
          <SelectTrigger id={`test-${rule.id}`}>
            <SelectValue placeholder={t("chooseTest")} />
          </SelectTrigger>
          <SelectContent>
            {tests.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`scale-${rule.id}`}>{t("scale")}</Label>
        <Select value={String(rule.scaleId)} onValueChange={(value) => onChange({ ...rule, scaleId: Number(value) })}>
          <SelectTrigger id={`scale-${rule.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(test?.scales ?? []).map((entry) => (
              <SelectItem key={entry.id} value={String(entry.id)}>
                {entry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`label-${rule.id}`}>{t("label")}</Label>
        <Input id={`label-${rule.id}`} maxLength={60} placeholder={scale?.name ?? t("labelHint")} value={rule.label} onChange={(event) => onChange({ ...rule, label: event.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`direction-${rule.id}`}>{t("direction")}</Label>
        <Select value={rule.direction} onValueChange={(direction) => onChange({ ...rule, direction: direction as WellbeingRule["direction"] })}>
          <SelectTrigger id={`direction-${rule.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIRECTIONS.map((direction) => (
              <SelectItem key={direction} value={direction}>
                {t(`directions.${direction}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
        {level("team")}
        {level("drop")}
        {level("person")}
      </div>
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p className="text-xs text-muted-foreground">{t("levelsHint")}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={t("remove", { name })}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </fieldset>
  );
}

export type SettingsPart = "general" | "sending" | "privacy" | "retention" | "fields" | "warnings" | "digest" | "support";

// The organization's settings, one settings section at a time. Every part saves the whole set, so
// the parts not shown keep their values.
export function SettingsForm({
  initial,
  tests,
  ruleTests = [],
  parts,
}: {
  initial: Settings;
  tests: { id: string; name: string }[];
  // Tests wellbeing rules can read, with their scales.
  ruleTests?: RuleTest[];
  parts: SettingsPart[];
}) {
  const t = useTranslations("settings");
  const common = useTranslations("common");
  const router = useRouter();
  const organization = useOrganization();
  const [values, setValues] = useState(initial);
  const changed = JSON.stringify(values) !== JSON.stringify(initial);

  const mutation = useMutation({
    mutationFn: async () => {
      // Rules are sent only from their own section, so saving elsewhere never rewrites them.
      return (await updateOrganizationSettings(parts.includes("warnings") ? values : { ...values, wellbeingRules: undefined })).slug;
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
      className="flex max-w-2xl flex-col gap-10"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      {parts.includes("general") && (
        <Section title={t("general")}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-name">{t("name")}</Label>
            <Input
              id="org-name"
              required
              minLength={2}
              maxLength={100}
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
          </div>
        </Section>
      )}
      {parts.includes("sending") && (
        <Section title={t("sending.title")} description={t("sending.text")}>
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="quiet-hours">{t("sending.quietHours")}</Label>
                <p className="text-sm text-muted-foreground">{t("sending.quietHoursText")}</p>
              </div>
              <Switch
                id="quiet-hours"
                checked={values.quietHours}
                onCheckedChange={(checked) => setValues({ ...values, quietHours: checked })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="time-zone">{t("sending.timeZone")}</Label>
              <Select value={values.timeZone || "auto"} onValueChange={(value) => setValues({ ...values, timeZone: value === "auto" ? "" : value })}>
                <SelectTrigger id="time-zone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("sending.serverTime")}</SelectItem>
                  {timeZones().map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("sending.timeZoneHint")}</p>
            </div>
          </div>
        </Section>
      )}
      {parts.includes("privacy") && (
        <Section title={t("privacy")} description={t("privacyText")}>
          <div className="flex flex-col gap-6">
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
            <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
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
                      <label key={test.id} className="flex items-start gap-2 rounded-md border bg-card p-2.5 text-sm">
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
          </div>
        </Section>
      )}
      {parts.includes("retention") && (
        <Section title={t("retention.title")} description={t("retention.text")}>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </Section>
      )}
      {parts.includes("fields") && (
        <Section title={t("fields.title")} description={t("fields.text")}>
          <div className="flex flex-col gap-3">
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
                <Plus className="size-4" />
                {t("fields.add")}
              </Button>
            )}
          </div>
        </Section>
      )}
      {parts.includes("warnings") && (
        <Section title={t("warnings.title")} description={t("warnings.text", { min: MIN_GROUP })}>
          <div className="flex flex-col gap-3">
            {values.wellbeingRules.map((rule, index) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                tests={ruleTests}
                onChange={(next) => setValues({ ...values, wellbeingRules: values.wellbeingRules.map((entry, i) => (i === index ? next : entry)) })}
                onRemove={() => setValues({ ...values, wellbeingRules: values.wellbeingRules.filter((_, i) => i !== index) })}
              />
            ))}
            <div className="flex flex-wrap gap-2">
              {values.wellbeingRules.length < 50 && ruleTests.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setValues({
                      ...values,
                      wellbeingRules: [
                        ...values.wellbeingRules,
                        {
                          id: `rule-${Date.now().toString(36)}`,
                          label: "",
                          testId: ruleTests[0].id,
                          scaleId: ruleTests[0].scales[0]?.id ?? 1,
                          direction: "high",
                          team: null,
                          drop: null,
                          person: null,
                        },
                      ],
                    })
                  }
                >
                  <Plus className="size-4" />
                  {t("warnings.add")}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setValues({ ...values, wellbeingRules: DEFAULT_RULES.filter((rule) => ruleTests.some((test) => test.id === rule.testId)) })
                }
              >
                <RotateCcw className="size-4" />
                {t("warnings.defaults")}
              </Button>
            </div>
          </div>
        </Section>
      )}
      {parts.includes("digest") && (
        <Section title={t("digest.title")} description={t("digest.text", { min: MIN_GROUP })}>
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="digest-enabled">{t("digest.enabled")}</Label>
                <p className="text-sm text-muted-foreground">{t("digest.enabledText")}</p>
              </div>
              <Switch id="digest-enabled" checked={values.digestEnabled} onCheckedChange={(checked) => setValues({ ...values, digestEnabled: checked })} />
            </div>
            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <Label htmlFor="digest-weekday">{t("digest.weekday")}</Label>
              <Select
                value={String(values.digestWeekday)}
                disabled={!values.digestEnabled}
                onValueChange={(value) => setValues({ ...values, digestWeekday: Number(value) })}
              >
                <SelectTrigger id="digest-weekday">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {t(`digest.days.${day}` as "digest.days.1")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>
      )}
      {parts.includes("support") && (
        <Section title={t("support.title")} description={t("support.text")}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="support-text">{t("support.message")}</Label>
              <Textarea
                id="support-text"
                rows={4}
                maxLength={2000}
                placeholder={t("support.messagePlaceholder")}
                value={values.supportText}
                onChange={(event) => setValues({ ...values, supportText: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="support-contacts">{t("support.contacts")}</Label>
              <Textarea
                id="support-contacts"
                rows={3}
                maxLength={1000}
                placeholder={t("support.contactsPlaceholder")}
                value={values.supportContacts}
                onChange={(event) => setValues({ ...values, supportContacts: event.target.value })}
              />
            </div>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium">{t("support.links")}</legend>
              {values.supportLinks.map((link, index) => {
                const change = (next: Partial<SupportLink>) =>
                  setValues({ ...values, supportLinks: values.supportLinks.map((entry, i) => (i === index ? { ...entry, ...next } : entry)) });
                return (
                  <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`link-label-${index}`}>{t("support.linkLabel")}</Label>
                      <Input id={`link-label-${index}`} required maxLength={80} value={link.label} onChange={(event) => change({ label: event.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`link-url-${index}`}>{t("support.linkUrl")}</Label>
                      <Input
                        id={`link-url-${index}`}
                        required
                        maxLength={500}
                        pattern="(https?://|mailto:|tel:).+"
                        placeholder="https://"
                        value={link.url}
                        onChange={(event) => change({ url: event.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("support.removeLink", { label: link.label || t("support.linkLabel") })}
                      onClick={() => setValues({ ...values, supportLinks: values.supportLinks.filter((_, i) => i !== index) })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
              {values.supportLinks.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() => setValues({ ...values, supportLinks: [...values.supportLinks, { label: "", url: "" }] })}
                >
                  <Plus className="size-4" />
                  {t("support.addLink")}
                </Button>
              )}
            </fieldset>
          </div>
        </Section>
      )}
      <div>
        <Button type="submit" disabled={!changed || mutation.isPending}>
          {common("save")}
        </Button>
      </div>
    </form>
  );
}
