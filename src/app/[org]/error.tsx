"use client";

import { ErrorMessage } from "@/components/error-message";

export default function OrganizationError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorMessage {...props} />;
}
