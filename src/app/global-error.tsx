"use client";

import { useEffect } from "react";
import "./globals.css";

// Shown when the root layout itself fails, so there are no translations or providers:
// the text is given in both interface languages.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-background px-4 font-sans text-foreground">
        <main className="flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p lang="ru" className="text-sm text-muted-foreground">
            Что-то пошло не так
          </p>
          {error.digest && <p className="text-xs text-muted-foreground">Reference / Код: {error.digest}</p>}
          <button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Try again · Попробовать снова
          </button>
        </main>
      </body>
    </html>
  );
}
