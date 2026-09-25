"use client";

import { useTranslations } from "next-intl";
import { toast } from "@/hooks/use-toast";
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
  const t = useTranslations("dashboard.tests");
  const common = useTranslations("common");
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
    extractTestData(targetFile, testData, setTestData).catch(() =>
      toast({
        title: common("fileErrorTitle"),
        description: common("fileErrorText"),
        variant: "destructive",
      })
    );
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
            <span className="text-lg font-bold tracking-wide">{t("add")}</span>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg">
            {t("newTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>{t("name")}</Label>
          <Input
            value={testData.name}
            placeholder={t("namePlaceholder")}
            onChange={(event) =>
              setTestData({
                ...testData,
                name: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("description")}</Label>
          <Textarea
            rows={3}
            value={testData.description}
            placeholder={t("descriptionPlaceholder")}
            onChange={(event) =>
              setTestData({
                ...testData,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("strategy")}</Label>
          <Select
            onValueChange={(selection) =>
              setTestData({
                ...testData,
                strategy: selection,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("strategyPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade">{t("strategies.grade")}</SelectItem>
              <SelectItem value="t-grade">{t("strategies.t-grade")}</SelectItem>
              <SelectItem value="standard-ten">
                {t("strategies.standard-ten")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("file")}</Label>
          <Input type="file" accept=".xlsx" onChange={fileUploadHandler} />
          <p className="text-sm text-muted-foreground">
            {common("fileHint")}
          </p>
        </div>

        <DialogClose asChild>
          <Button
            className="w-full"
            onClick={() => {
              uploadTestMutation.mutate();
            }}
          >
            {common("save")}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
