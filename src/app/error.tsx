"use client";

import { ErrorMessage } from "@/components/error-message";

// Pages outside an organization: assessments, account, shared reports, sign-in.
export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4">
      <ErrorMessage {...props} />
    </main>
  );
}
