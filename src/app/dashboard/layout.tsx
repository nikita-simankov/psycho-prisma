import React from "react";
import { DashboardNavbar } from "./components/dashboard-navbar";

type Properties = {
  children: React.ReactNode;
};

const DashboardLayout: React.FC<Properties> = ({ children }) => {
  return (
    <div className="flex flex-col">
      <DashboardNavbar />
      <div className="w-full h-full rounded-l-xl">{children}</div>
    </div>
  );
};

export default DashboardLayout;
