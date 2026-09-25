import { ensureMember } from "@/utils/authentication";
import React from "react";
import { DashboardSidebar, DashboardTopbar } from "./components/dashboard-navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await ensureMember("viewDashboard");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <DashboardSidebar context={context} />
      <div className="flex min-w-0 flex-col">
        <DashboardTopbar context={context} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
