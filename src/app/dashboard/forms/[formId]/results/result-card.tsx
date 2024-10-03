"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "@prisma/client";
import { Router } from "lucide-react";
import { redirect, useRouter } from "next/navigation";

type Properties = {
  user: User;
  formId: string;
  resultId: string;
};

export const ResultCard: React.FC<Properties> = ({
  user,
  formId,
  resultId,
}) => {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer"
      onClick={() =>
        router.push("/dashboard/forms/" + formId + "/results/" + resultId)
      }
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle>
            {user?.lastName} {user?.name} {user?.surname}
          </CardTitle>
          <CardDescription>
            {user?.rank}, {user?.division}
          </CardDescription>
        </div>
        <Badge>{user?.group}</Badge>
      </CardHeader>
    </Card>
  );
};
