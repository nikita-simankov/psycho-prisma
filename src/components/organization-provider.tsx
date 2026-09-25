"use client";

import { createContext, useContext } from "react";

type OrganizationValue = { slug: string; name: string; role: string };

const OrganizationContext = createContext<OrganizationValue | null>(null);

// Makes the organization in the URL available to client components under /[org].
export function OrganizationProvider({ value, children }: { value: OrganizationValue; children: React.ReactNode }) {
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const value = useContext(OrganizationContext);

  if (!value) {
    throw new Error("useOrganization must be used inside an organization page");
  }

  return value;
}

// "/acme", to prefix links within the organization.
export function useOrganizationBase() {
  return `/${useOrganization().slug}`;
}
