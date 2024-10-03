"use client";

import { uploadTestData } from "@/actions/test/upload-test-data-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TestData } from "@/utils/constants";
import { extractTestData } from "@/utils/sheet/test";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";

export const CreateTestDialog: React.FC = () => {
  const router = useRouter();
  const [testData, setTestData] = useState<TestData>({
    name: "",
    strategy: "",
    description: "",
    instruction: "",

    scales: [],
    questions: [],
    questionsResponses: [],

    stanTable: [],
    tGradeTable: [],
    summaryTable: [],
  });

  const fileUploadHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const targetFile = event.target.files![0];
    extractTestData(targetFile, testData, setTestData);
  };

  const uploadTestMutation = useMutation({
    mutationFn: () => uploadTestData(testData),

    onSuccess: (createdTest) => {
      setTestData({
        name: "",
        strategy: "",
        description: "",
        instruction: "",

        scales: [],
        questions: [],
        questionsResponses: [],

        stanTable: [],
        tGradeTable: [],
        summaryTable: [],
      });

      router.push("/dashboard/tests/" + createdTest.id);
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="aspect-video cursor-pointer border-dashed border-2 border-gray-300 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-950 transition-all">
          <CardContent className="p-6 w-full h-full flex flex-col gap-2 items-center justify-center">
            <FlaskConical />
            <h1 className="text-lg font-bold tracking-wide">
              Добавить методику
            </h1>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg">
            Добавить новую методику
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Название анкеты</Label>
          <Input
            value={testData.name}
            placeholder="Введите название анкеты"
            onChange={(event) =>
              setTestData({
                ...testData,
                name: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Описание анкеты</Label>
          <Textarea
            rows={3}
            value={testData.description}
            placeholder="Введите краткое описание анкеты"
            onChange={(event) =>
              setTestData({
                ...testData,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Метод обработки результатов</Label>
          <Select
            onValueChange={(selection) =>
              setTestData({
                ...testData,
                strategy: selection,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите метод обработки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade">Подсчёт баллов</SelectItem>
              <SelectItem value="t-grade">Подсчёт Т-баллов</SelectItem>
              <SelectItem value="standard-ten">
                Стандартная десятка (СТЭН)
              </SelectItem>
            </SelectContent>
          </Select>
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
              uploadTestMutation.mutate();
            }}
          >
            Сохранить
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
