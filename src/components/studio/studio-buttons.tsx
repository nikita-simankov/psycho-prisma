"use client";

import { copyInstrument, createInstrument, restoreInstrumentVersion } from "@/actions/studio/studio-actions";
import { useOrganizationBase } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { InstrumentKind } from "@/utils/instrument-content";
import { useMutation } from "@tanstack/react-query";
import { Copy, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

function useEditorPath() {
  const base = useOrganizationBase();
  return (kind: InstrumentKind, id: string) => `${base}/${kind === "test" ? "tests" : "forms"}/${id}/edit`;
}

function useFailure() {
  const common = useTranslations("common");
  return () => toast({ title: common("error"), variant: "destructive" });
}

// Names a new test or questionnaire, then opens it in the studio.
export function NewInstrumentButton({ kind }: { kind: InstrumentKind }) {
  const t = useTranslations(`studio.new.${kind}`);
  const studio = useTranslations("studio.new");
  const router = useRouter();
  const editorPath = useEditorPath();
  const failed = useFailure();
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: () => createInstrument(kind, name),
    onSuccess: ({ id }) => router.push(editorPath(kind, id)),
    onError: failed,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{studio("text")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-name">{studio("name")}</Label>
            <Input id="new-name" autoFocus value={name} maxLength={200} onChange={(event) => setName(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {studio("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CopyInstrumentButton({ kind, id }: { kind: InstrumentKind; id: string }) {
  const t = useTranslations("studio");
  const router = useRouter();
  const editorPath = useEditorPath();
  const failed = useFailure();
  const copy = useMutation({
    mutationFn: () => copyInstrument(kind, id),
    onSuccess: (created) => router.push(editorPath(kind, created.id)),
    onError: failed,
  });

  return (
    <Button variant="outline" disabled={copy.isPending} onClick={() => copy.mutate()}>
      <Copy className="mr-2 h-4 w-4" />
      {t("copy")}
    </Button>
  );
}

// Puts an earlier version into the draft and opens the editor to review and publish it.
export function RestoreVersionButton({ kind, id, version }: { kind: InstrumentKind; id: string; version: number }) {
  const t = useTranslations("studio.versions");
  const router = useRouter();
  const editorPath = useEditorPath();
  const failed = useFailure();
  const restore = useMutation({
    mutationFn: () => restoreInstrumentVersion(kind, id, version),
    onSuccess: () => router.push(editorPath(kind, id)),
    onError: failed,
  });

  return (
    <Button variant="outline" size="sm" disabled={restore.isPending} onClick={() => restore.mutate()}>
      {t("restore")}
    </Button>
  );
}
