"use client";

import { updateProfileDetails } from "@/actions/user/update-profile-details-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { EMPLOYMENT_TYPES, type CustomField } from "@/utils/profile-fields";
import { useMutation } from "@tanstack/react-query";
import { IdCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NONE = "__none__";

type Details = {
  managerId: string | null;
  startDate: string;
  location: string;
  employmentType: string;
  tags: string[];
  customValues: Record<string, string>;
};

// Work details kept for each person in this organization.
export function ProfileDetailsDialog({
  userId,
  name,
  current,
  managers,
  fields,
}: {
  userId: string;
  name: string;
  current: Details;
  managers: { id: string; name: string }[];
  fields: CustomField[];
}) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(current);
  const [tags, setTags] = useState(current.tags.join(", "));

  const mutation = useMutation({
    mutationFn: () =>
      updateProfileDetails(userId, {
        ...values,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
    onError: () => toast({ title: common("error"), description: t("updateError"), variant: "destructive" }),
  });

  const setCustom = (key: string, value: string) => setValues({ ...values, customValues: { ...values.customValues, [key]: value } });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValues(current);
          setTags(current.tags.join(", "));
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <IdCard className="mr-2 h-4 w-4" />
          {t("details.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("details.title")}</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="manager">{t("fields.manager")}</Label>
            <Select value={values.managerId ?? NONE} onValueChange={(id) => setValues({ ...values, managerId: id === NONE ? null : id })}>
              <SelectTrigger id="manager">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("details.noManager")}</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="start-date">{t("fields.startDate")}</Label>
            <Input id="start-date" type="date" value={values.startDate} onChange={(event) => setValues({ ...values, startDate: event.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="employment">{t("fields.employmentType")}</Label>
            <Select value={values.employmentType || NONE} onValueChange={(type) => setValues({ ...values, employmentType: type === NONE ? "" : type })}>
              <SelectTrigger id="employment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("details.notSet")}</SelectItem>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`employment.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="location">{t("fields.location")}</Label>
            <Input id="location" maxLength={120} value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="tags">{t("fields.tags")}</Label>
            <Input id="tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t("details.tagsHint")} />
          </div>
          {fields.map((field) => {
            const id = `custom-${field.key}`;
            const value = values.customValues[field.key] ?? "";
            return (
              <div key={field.key} className="flex flex-col gap-2">
                <Label htmlFor={id}>{field.label}</Label>
                {field.type === "select" ? (
                  <Select value={value || NONE} onValueChange={(option) => setCustom(field.key, option === NONE ? "" : option)}>
                    <SelectTrigger id={id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("details.notSet")}</SelectItem>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={id}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    maxLength={200}
                    value={value}
                    onChange={(event) => setCustom(field.key, event.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {common("cancel")}
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
