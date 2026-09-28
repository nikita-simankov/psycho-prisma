"use client";

import { UpdateUserInfoAction } from "@/actions/user/update-user-info-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { PublicUser } from "@/utils/user";
import { useMutation } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Photos are shrunk before upload: they are stored inline and sent with every page that shows them.
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const PHOTO_SIZE = 256;

// A square JPEG of the photo's centre, as base64 without the data: prefix.
async function squarePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(PHOTO_SIZE, side);
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85).replace(/^data:image\/jpeg;base64,/, "");
}
const TEXT_FIELDS = ["lastName", "name", "middleName", "dateOfBirth"] as const;

type EditableFields = Record<(typeof TEXT_FIELDS)[number], string> & { imageURL?: string };

export default function EditUserDialog({ user }: { user: PublicUser }) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<EditableFields>({
    lastName: user.lastName,
    name: user.name,
    middleName: user.middleName,
    dateOfBirth: user.dateOfBirth,
  });

  const mutation = useMutation({
    mutationFn: () => UpdateUserInfoAction(user.id, values),
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
    onError: () =>
      toast({ title: common("error"), description: t("updateError"), variant: "destructive" }),
  });

  const onPhotoChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const photo = file.type.startsWith("image/") && file.size <= MAX_PHOTO_BYTES ? await squarePhoto(file).catch(() => null) : null;
    if (!photo) {
      toast({ title: common("error"), description: t("photoHint"), variant: "destructive" });
      return;
    }
    setValues({ ...values, imageURL: photo });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          {common("edit")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="photo">{t("fields.photo")}</Label>
            <Input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onPhotoChange(event.target.files?.[0])}
            />
            <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
          </div>
          {TEXT_FIELDS.map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <Label htmlFor={field}>{t(`fields.${field}`)}</Label>
              <Input
                id={field}
                value={values[field]}
                onChange={(event) => setValues({ ...values, [field]: event.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
