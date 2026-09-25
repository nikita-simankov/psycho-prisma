import React from "react";
import { DashboardNavbar } from "./components/dashboard-navbar";
import { ensureAdmin } from "@/utils/authentication";

type Properties = {
  children: React.ReactNode;
};

const DashboardLayout = async ({ children }: Properties) => {
  await ensureAdmin();

  return (
    <div className="flex flex-col">
      <DashboardNavbar />
      <div className="w-full h-full rounded-l-xl">{children}</div>
    </div>
  );
};

export default DashboardLayout;
