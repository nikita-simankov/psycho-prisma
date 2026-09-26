import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "@/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ReactNode } from "react";

const POINTS = ["consent", "access", "judgement"] as const;

type Properties = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

// Split layout for sign-in and sign-up: form on the left, a quiet brand column on the right.
export async function AuthShell({ title, subtitle, children }: Properties) {
  const t = await getTranslations();

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Logo withText />
          </Link>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-medium leading-[1.1]">{title}</h1>
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <aside className="hidden border-l bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-14">
        <Link href="/" className="w-fit">
          <Logo withText />
        </Link>
        <div className="flex max-w-lg flex-col gap-10">
          <p className="font-heading text-4xl font-normal leading-[1.15] text-balance">{t("auth.signIn.aside")}</p>
          <ol className="flex flex-col border-t border-foreground/80">
            {POINTS.map((key, index) => (
              <li key={key} className="grid grid-cols-[2.5rem_1fr] gap-x-2 border-b py-4">
                <span className="pt-0.5 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium">{t(`landing.trust.${key}.title`)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t(`landing.trust.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="max-w-lg text-xs text-muted-foreground">{t("site.footer.disclaimer")}</p>
      </aside>
    </main>
  );
}
