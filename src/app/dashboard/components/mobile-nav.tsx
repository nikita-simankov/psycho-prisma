"use client";

import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DashboardNav } from "./dashboard-nav";

export function MobileNav({ role, switcher }: { role: string; switcher: React.ReactNode }) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("menu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 flex flex-col gap-6">
        <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
        <Logo withText />
        {switcher}
        <DashboardNav role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
