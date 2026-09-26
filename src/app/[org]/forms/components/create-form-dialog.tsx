"use client";

import { useTranslations } from "next-intl";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { FormData } from "@/utils/constants";
import { extractFormQuestions } from "@/utils/sheet/form";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFormData } from "@/actions/form/upload-form-data-action";
import { Switch } from "@/components/ui/switch";

export const CreateFormDialog: React.FC = () => {
  const router = useRouter();
  const t = useTranslations("dashboard.forms");
  const common = useTranslations("common");
  const studio = useTranslations("studio");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    questions: [],
    description: "",
    adminOnly: false,
  });

  const uploadFormMutation = useMutation({
    mutationFn: () => uploadFormData(formData),

    onSuccess: () => router.refresh(),
  });

  const fileUploadHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files![0];
    extractFormQuestions(uploadedFile, formData, setFormData).catch(() =>
      toast({
        title: common("fileErrorTitle"),
        description: common("fileErrorText"),
        variant: "destructive",
      })
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {studio("import")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{t("newTitle")}</DialogTitle>
          <DialogDescription>
            {t("newDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>{t("name")}</Label>
          <Input
            value={formData.name}
            placeholder={t("namePlaceholder")}
            onChange={(event) =>
              setFormData({
                ...formData,
                name: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("description")}</Label>
          <Textarea
            rows={3}
            value={formData.description}
            placeholder={t("descriptionPlaceholder")}
            onChange={(event) =>
              setFormData({
                ...formData,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-row items-center justify-between p-4 border rounded-md">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold">{t("adminOnly")}</h2>
            <span className="text-sm font-medium text-muted-foreground">
              {t("adminOnlyHint")}
            </span>
          </div>
          <Switch
            checked={formData.adminOnly}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                adminOnly: checked,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("questions")}</Label>
          <Input type="file" accept=".xlsx" onChange={fileUploadHandler} />
          <p className="text-sm text-muted-foreground">
            {common("fileHint")}
          </p>
        </div>

        <DialogClose asChild>
          <Button
            className="w-full"
            onClick={() => {
              uploadFormMutation.mutate();
              router.refresh();
            }}
          >
            {common("save")}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
