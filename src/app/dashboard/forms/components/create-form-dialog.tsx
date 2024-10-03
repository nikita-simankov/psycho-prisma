"use client";

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

export const CreateFormDialog: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    questions: [],
    description: "",
  });

  const uploadFormMutation = useMutation({
    mutationFn: () => uploadFormData(formData),

    onSuccess: () => router.refresh,
  });

  const fileUploadHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files![0];
    extractFormQuestions(uploadedFile, formData, setFormData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="aspect-video border-2 border-dashed border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
          <CardContent className="h-full pt-4 flex flex-col items-center justify-center gap-2 text-lg font-bold tracking-wide">
            <Plus />
            Добавить анкету
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Новая анкета</DialogTitle>
          <DialogDescription>
            Создайте анкету, чтобы начать собирать данные о пользователях
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Название анкеты</Label>
          <Input
            value={formData.name}
            placeholder="Введите название анкеты"
            onChange={(event) =>
              setFormData({
                ...formData,
                name: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Описание анкеты</Label>
          <Textarea
            rows={3}
            value={formData.description}
            placeholder="Введите краткое описание анкеты"
            onChange={(event) =>
              setFormData({
                ...formData,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Вопросы</Label>
          <Input type="file" onChange={fileUploadHandler} />
          <p className="text-sm text-muted-foreground">
            Выберите файл для загрузки. Поддерживаемые форматы: XLS, XLSX.
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
            Сохранить
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
