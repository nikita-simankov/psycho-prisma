"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PrintButton() {
  const t = useTranslations("common");

  return (
    <Button
      variant="outline"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4 mr-2" />
      {t("print")}
    </Button>
  );
}
