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
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { FormData } from "@/utils/constants";
import { extractFormQuestions } from "@/utils/sheet/form";
import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { uploadFormData } from "@/actions/form/upload-form-data-action";
import { Switch } from "@/components/ui/switch";

export const CreateFormDialog: React.FC = () => {
  const router = useRouter();
  const t = useTranslations("dashboard.forms");
  const common = useTranslations("common");
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
        <Card className="aspect-video border-2 border-dashed border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
          <CardContent className="h-full pt-4 flex flex-col items-center justify-center gap-2 text-lg font-bold tracking-wide">
            <Plus />
            {t("add")}
          </CardContent>
        </Card>
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
