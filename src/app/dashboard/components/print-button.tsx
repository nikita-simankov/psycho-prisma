"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <Button
      size="icon"
      variant="outline"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4" />
    </Button>
  );
}
